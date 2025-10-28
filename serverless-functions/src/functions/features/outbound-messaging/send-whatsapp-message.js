/**
 * Send WhatsApp Message with Queue Routing
 * 
 * This function sends an outbound WhatsApp message and creates a task routed to a specific queue.
 * It supports both template messages (Content API) and free-form text messages.
 * 
 * Parameters:
 * - to: Destination phone number (E.164 format, e.g., +5511999999999)
 * - from: Twilio WhatsApp number (E.164 format, e.g., whatsapp:+14155238886)
 * - queueSid: TaskRouter Queue SID to route the task (required)
 * - contentTemplateSid: (Optional) Content Template SID for WhatsApp approved templates
 * - body: (Optional) Message body for free-form messages (used if contentTemplateSid not provided)
 * - assignDirectly: (Optional) Assign task directly to worker (default: true)
 * - workerSid: (Optional) Agent worker SID initiating the conversation
 * - workerFriendlyName: (Optional) Agent name for task attributes
 * - workspaceSid: (Optional) TaskRouter Workspace SID (defaults to env var)
 * - workflowSid: (Optional) TaskRouter Workflow SID (defaults to env var)
 * - priority: (Optional) Task priority (default: 0, or 100 if assignDirectly=true)
 * - timeout: (Optional) Task timeout in seconds (default: 86400 - 24 hours)
 * - openChatFlag: (Optional) Create task immediately (true) or wait for customer reply (false, default)
 */

const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {
  const {
    to,
    from,
    queueSid,
    contentTemplateSid,
    body,
    workerSid,
    workerFriendlyName,
    workspaceSid,
    workflowSid,
    priority,
    timeout,
  } = event;

  let { openChatFlag, assignDirectly } = event;
  openChatFlag = openChatFlag === 'true' ? true : false;
  assignDirectly = assignDirectly === 'true' ? true : assignDirectly === 'false' ? false : true; // Default true

  const client = context.getTwilioClient();

  // Create Twilio Response with CORS headers
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    // Validate required parameters
    if (!to) {
      throw new Error('Missing required parameter: to');
    }
    if (!from) {
      throw new Error('Missing required parameter: from');
    }
    if (!queueSid) {
      throw new Error('Missing required parameter: queueSid');
    }
    if (!contentTemplateSid && !body) {
      throw new Error('Must provide either contentTemplateSid or body');
    }

    // Normalize phone numbers to E.164 format with whatsapp: prefix
    // Ensure we keep the + sign for E.164 format
    let toNumber = to.trim();
    if (!toNumber.startsWith('whatsapp:')) {
      // Remove all non-digit characters except +
      toNumber = toNumber.replace(/[^\d+]/g, '');
      // Ensure it starts with +
      if (!toNumber.startsWith('+')) {
        toNumber = '+' + toNumber;
      }
      toNumber = `whatsapp:${toNumber}`;
    }

    let fromNumber = from.trim();
    if (!fromNumber.startsWith('whatsapp:')) {
      // Remove all non-digit characters except +
      fromNumber = fromNumber.replace(/[^\d+]/g, '');
      // Ensure it starts with +
      if (!fromNumber.startsWith('+')) {
        fromNumber = '+' + fromNumber;
      }
      fromNumber = `whatsapp:${fromNumber}`;
    }

    console.log('Creating WhatsApp conversation', {
      to: toNumber,
      from: fromNumber,
      queueSid,
      openChatFlag,
      hasTemplate: !!contentTemplateSid,
    });

    // Step 1: Check for existing active conversation
    const existingConversations = await client.conversations.v1.participantConversations.list({
      address: toNumber,
      limit: 20,
    });

    const activeConversation = existingConversations.find((pc) => pc.conversationState === 'active');

    let conversation;
    let isNewConversation = false;

    if (activeConversation) {
      console.log('Found existing active conversation:', activeConversation.conversationSid);
      conversation = await client.conversations.v1.conversations(activeConversation.conversationSid).fetch();

      // Check if there's already an active task for this conversation
      const attributes = JSON.parse(conversation.attributes || '{}');
      if (attributes.taskSid) {
        // There's an active task - check if it's still open
        const workspaceId = workspaceSid || process.env.TWILIO_FLEX_WORKSPACE_SID;
        try {
          const task = await client.taskrouter.v1
            .workspaces(workspaceId)
            .tasks(attributes.taskSid)
            .fetch();

          if (['pending', 'reserved', 'assigned', 'wrapping'].includes(task.assignmentStatus)) {
            response.appendHeader('Content-Type', 'application/json');
            response.setBody({
              success: false,
              errorMessage: `An active task already exists for this conversation (Status: ${task.assignmentStatus})`,
              conversationSid: conversation.sid,
              taskSid: task.sid,
            });
            return callback(null, response);
          }
        } catch (taskError) {
          console.log('Task not found or error fetching task:', taskError.message);
          // Task doesn't exist or is closed - we can proceed
        }
      }
    } else {
      // Step 2: Create new conversation
      console.log('Creating new conversation');
      conversation = await client.conversations.v1.conversations.create({
        friendlyName: `WhatsApp conversation with ${toNumber}`,
        attributes: JSON.stringify({
          from: fromNumber,
          to: toNumber,
          initiatedBy: workerFriendlyName || workerSid || 'system',
          initiatedAt: new Date().toISOString(),
        }),
      });
      isNewConversation = true;
      console.log('Created conversation:', conversation.sid);
    }

    // Step 3: Add participants if new conversation
    if (isNewConversation) {
      // Add customer participant
      await client.conversations.v1.conversations(conversation.sid).participants.create({
        'messagingBinding.address': toNumber,
        'messagingBinding.proxyAddress': fromNumber,
      });
      console.log('Added customer participant');

      // Add agent participant if workerSid provided
      if (workerSid) {
        try {
          const worker = await client.taskrouter.v1
            .workspaces(workspaceSid || process.env.TWILIO_FLEX_WORKSPACE_SID)
            .workers(workerSid)
            .fetch();

          if (worker.attributes) {
            const workerAttributes = JSON.parse(worker.attributes);
            const chatIdentity = workerAttributes.email || workerAttributes.full_name || workerSid;

            await client.conversations.v1.conversations(conversation.sid).participants.create({
              identity: chatIdentity,
            });
            console.log('Added agent participant:', chatIdentity);
          }
        } catch (workerError) {
          console.log('Could not add agent participant:', workerError.message);
        }
      }
    }

    // Step 4: Send message
    let message;
    if (contentTemplateSid) {
      // Send template message using Content API
      message = await client.conversations.v1.conversations(conversation.sid).messages.create({
        contentSid: contentTemplateSid,
        author: fromNumber,
      });
      console.log('Sent template message:', message.sid);
    } else {
      // Send free-form text message
      message = await client.conversations.v1.conversations(conversation.sid).messages.create({
        body: body,
        author: fromNumber,
      });
      console.log('Sent text message:', message.sid);
    }

    // Step 5: Create task if openChatFlag is true
    let task;
    if (openChatFlag) {
      const workspaceId = workspaceSid || process.env.TWILIO_FLEX_WORKSPACE_SID;
      const workflowId = workflowSid || process.env.TWILIO_FLEX_CHAT_WORKFLOW_SID || process.env.TWILIO_FLEX_WORKFLOW_SID;

      const taskAttributes = {
        channelType: 'whatsapp',
        name: toNumber,
        to: toNumber,
        from: fromNumber,
        direction: 'outbound',
        conversationSid: conversation.sid,
        initiatedBy: workerFriendlyName || workerSid || 'system',
        customers: {
          phone: toNumber,
        },
      };

      if (workerSid) {
        taskAttributes.workerSid = workerSid;
      }
      if (workerFriendlyName) {
        taskAttributes.workerFriendlyName = workerFriendlyName;
      }

      // Add targetWorker for direct assignment
      let taskPriority = priority || 0;
      if (assignDirectly && workerSid) {
        taskAttributes.targetWorker = workerSid;
        taskPriority = 100; // Higher priority for direct assignment
        console.log('Task will be assigned directly to worker:', workerSid);
      } else {
        console.log('Task will be routed to queue:', queueSid);
      }

      task = await client.taskrouter.v1.workspaces(workspaceId).tasks.create({
        workflowSid: workflowId,
        taskChannel: 'chat',
        attributes: JSON.stringify(taskAttributes),
        priority: taskPriority,
        timeout: timeout || 86400, // 24 hours default
        routingTarget: queueSid, // Route directly to specified queue
      });

      console.log('Created task:', task.sid, 'routed to queue:', queueSid);

      // Update conversation attributes with task SID
      await client.conversations.v1.conversations(conversation.sid).update({
        attributes: JSON.stringify({
          ...JSON.parse(conversation.attributes || '{}'),
          taskSid: task.sid,
          queueSid: queueSid,
        }),
      });
    } else {
      console.log('Task creation skipped (openChatFlag is false) - waiting for customer reply');
    }

    // Step 6: Return success response
    response.appendHeader('Content-Type', 'application/json');
    response.setBody({
      success: true,
      conversationSid: conversation.sid,
      messageSid: message.sid,
      taskSid: task ? task.sid : null,
      queueSid: queueSid,
      isNewConversation,
    });

    return callback(null, response);
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    response.appendHeader('Content-Type', 'application/json');
    response.setBody({
      success: false,
      errorMessage: err.message,
      errorDetails: err.toString(),
    });
    response.setStatusCode(500);
    return callback(null, response);
  }
});
