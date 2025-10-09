import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SidePanel, Manager, useFlexSelector } from "@twilio/flex-ui";
import {
  Label,
  Select,
  Option,
  HelpText,
  Separator,
  Box,
  Text,
  TextArea,
  Button
} from "@twilio-paste/core";
import { PhoneNumberUtil, AsYouTypeFormatter } from "google-libphonenumber";
import { Actions } from "@twilio/flex-ui";
import { fetchQueuesFallback } from '../utils/fetchQueuesFallback';

interface SendWhatsappSidePanelProps {
  isOpen: boolean;
  phoneNumber: string;
  templates: any[];
  onClose: () => void;
  queueFilterSids?: string[];
}

export const SendWhatsappSidePanel: React.FC<SendWhatsappSidePanelProps> = ({
  isOpen,
  templates,
  phoneNumber,
  onClose,
  queueFilterSids = [],
}) => {
  const [toNumber, setToNumber] = useState(phoneNumber);
  const [contentTemplateSid, setContentTemplateSid] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [queueSid, setQueueSid] = useState("");
  const [queueFirstLoadTs] = useState(Date.now());
  const [queueManuallyRefreshed, setQueueManuallyRefreshed] = useState(false);
  const [fallbackQueues, setFallbackQueues] = useState<any[]>([]);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const manager = Manager.getInstance();
  // Reactive subscription to queue list; ensures re-render when Flex populates realtimeQueues later
  const queueOptions = useFlexSelector(state => {
    const ql = state.flex?.realtimeQueues?.queuesList || {};
    return Object.values(ql);
  }) as any[];

  const queueFilterValues = useMemo(() => {
    const normalized = new Set<string>();
    queueFilterSids.forEach((value: string) => {
      if (!value) return;
      const trimmed = String(value).trim();
      if (trimmed) {
        normalized.add(trimmed.toLowerCase());
      }
    });
    return normalized;
  }, [queueFilterSids]);

  const applyQueueFilter = useCallback(
    (queues: any[] = []) => {
      return queues.filter((queue) => {
        const candidates = [
          typeof queue.sid === 'string' ? queue.sid : undefined,
          typeof queue.friendlyName === 'string' ? queue.friendlyName : undefined,
          typeof queue.queueName === 'string' ? queue.queueName : undefined,
        ]
          .filter(Boolean)
          .map((candidate) => candidate!.toString().toLowerCase());
        if (candidates.some((candidate) => candidate.includes('voice'))) {
          return false;
        }
        if (!queueFilterValues.size) {
          return true;
        }
        return candidates.some((candidate) => {
          for (const filterValue of queueFilterValues) {
            if (candidate.includes(filterValue)) {
              return true;
            }
          }
          return false;
        });
      });
    },
    [queueFilterValues],
  );

  const filteredRealtimeQueues = useMemo(() => applyQueueFilter(queueOptions), [applyQueueFilter, queueOptions]);
  const filteredFallbackQueues = useMemo(() => applyQueueFilter(fallbackQueues), [applyQueueFilter, fallbackQueues]);
  const filtersActive = queueFilterValues.size > 0;

  // Log changes nas filas para depuração
  useEffect(() => {
    console.debug('[SendWhatsappSidePanel] queueOptions update', {
      total: queueOptions.length,
      filtered: filteredRealtimeQueues.length,
      filtersActive,
      filterValues: Array.from(queueFilterValues),
    });
  }, [queueOptions, filteredRealtimeQueues.length, filtersActive, queueFilterValues]);

  const queuesLoading = queueOptions.length === 0 && Date.now() - queueFirstLoadTs < 8000; // até 8s consideramos carregando
  const queuesEmptyAfterLoad = (queueOptions.length === 0 || (filtersActive && filteredRealtimeQueues.length === 0)) && !queuesLoading;

  const handleRefreshQueues = () => {
    // Não há API direta aqui; rely on Flex internals -> forçar um noop para provocar re-render
    setQueueManuallyRefreshed(true);
    console.debug('[SendWhatsappSidePanel] Manual queue refresh requested (re-render only)');
    if (queueOptions.length === 0) {
      fetchQueuesFallback().then(q => {
        setFallbackQueues(q);
        const filtered = applyQueueFilter(q);
        console.debug('[SendWhatsappSidePanel] Fallback queues loaded', {
          rawCount: q.length,
          filteredCount: filtered.length,
        });
        if (!queueSid && filtered.length > 0) {
          setQueueSid(filtered[0].sid);
        }
      });
    }
  };

  // Quando o painel abrir, zere os campos e preencha o número
  useEffect(() => {
    if (isOpen) {
      setToNumber(phoneNumber);
      setContentTemplateSid("");
      setQueueSid("");
      setFallbackQueues([]);
      setFallbackTriggered(false);
      setFallbackLoading(false);
    }
  }, [isOpen, phoneNumber]);

  // Auto fallback: se após breve período ainda não houver filas realtime, busca via REST
  useEffect(() => {
    if (!isOpen) return;
    if (queueOptions.length > 0) return; // realtime chegou
    if (fallbackTriggered) return;
    const timer = setTimeout(() => {
      console.debug('[SendWhatsappSidePanel] Auto fallback trigger (realtime vazio)');
      setFallbackTriggered(true);
      setFallbackLoading(true);
      fetchQueuesFallback().then(q => {
        setFallbackQueues(q);
        const filtered = applyQueueFilter(q);
        setFallbackLoading(false);
        console.debug('[SendWhatsappSidePanel] Auto fallback queues loaded', {
          rawCount: q.length,
          filteredCount: filtered.length,
        });
        // Se nenhuma fila selecionada ainda e veio algo, pré-seleciona primeira
        if (!queueSid && filtered.length > 0) {
          setQueueSid(filtered[0].sid);
        }
      });
    }, 2000); // 2s de espera para dar chance ao realtime
    return () => clearTimeout(timer);
  }, [isOpen, queueOptions, fallbackTriggered, queueSid, applyQueueFilter]);

  useEffect(() => {
    if (!isOpen) return;
    if (queueSid) return;
    const candidate = filteredRealtimeQueues[0] || filteredFallbackQueues[0];
    if (candidate?.sid) {
      setQueueSid(candidate.sid);
    }
  }, [isOpen, queueSid, filteredRealtimeQueues, filteredFallbackQueues]);

  // Validação básica de número internacional
  const isToNumberValid = (() => {
    if (!toNumber) return false;
    try {
      const phoneUtil = PhoneNumberUtil.getInstance();
      // Tenta parse adicionando '+' se faltar
      const raw = toNumber.startsWith('+') ? toNumber : `+${toNumber}`;
      const parsed = phoneUtil.parse(raw);
      return phoneUtil.isPossibleNumber(parsed);
    } catch {
      // Fallback simples: 8+ dígitos
      return /[0-9]{8,}/.test(toNumber.replace(/[^0-9]/g, ''));
    }
  })();

  // Exibe número formatado
  let friendlyPhoneNumber = "";
  try {
    const formatter = new AsYouTypeFormatter("BR");
    friendlyPhoneNumber = "";
    [...toNumber].forEach((c) => (friendlyPhoneNumber = formatter.inputDigit(c)));
  } catch {
    friendlyPhoneNumber = toNumber;
  }

  // Envia WhatsApp
  const handleSend = async () => {
    setIsSending(true);
    try {
      let normalizedNumber = toNumber.trim();
      // Garante que o número começa com +
      if (!normalizedNumber.startsWith("+")) {
        normalizedNumber = "+" + normalizedNumber.replace(/^0+/, "");
      }

      await Actions.invokeAction("SendOutboundMessage", {
        destination: `whatsapp:${normalizedNumber}`,
        callerId: `whatsapp:${process.env.FLEX_APP_TWILIO_WHATSAPP_FROM_NUMBER}`,
        contentTemplateSid,
        messageType: "whatsapp",
        openChat: true,
        routeToMe: true,
  queueSid: queueSid || undefined
      });

      onClose();
    } catch (e: any) {
      alert("Erro ao enviar mensagem: " + e.message);
    }
    setIsSending(false);
  };



  if (!isOpen) return null;

  return (
    <Box
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 400,
        background: "#fff",
        zIndex: 9999,
        boxShadow: "0 0 16px rgba(0,0,0,.14)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cabeçalho */}
      <Box
        padding="space50"
        borderBottomStyle="solid"
        borderBottomWidth="borderWidth10"
        borderBottomColor="colorBorderWeak"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="colorBackground"
      >
        <Text as="h3" fontWeight="fontWeightBold" fontSize="fontSize40">
          Enviar WhatsApp
        </Text>
        <Button size="icon_small" variant="secondary_icon" onClick={onClose}>
          ✕
        </Button>
      </Box>
      {/* Corpo */}
      <Box flex="1 1 0" overflowY="auto" padding={"space50"}>
        <Label htmlFor="select_content_template">Telefone</Label>
        <Text as="p" marginBottom="space40" fontWeight="fontWeightSemibold">
          {friendlyPhoneNumber || toNumber}
        </Text>
    <Label htmlFor="select_content_template">Template WhatsApp</Label>
          <Select
            id="select_content_template"
            value={contentTemplateSid}
            onChange={e => setContentTemplateSid(e.target.value)}
          >
            <Option value="">Selecione um template</Option>
            {templates.map(template => (
            <Option value={template.sid} key={template.sid}>
                {template.name}
            </Option>
            ))}
          </Select>
        <HelpText>
      Escolha um template aprovado para envio via WhatsApp. Mensagens personalizadas foram desabilitadas.
        </HelpText>
    <Separator orientation="horizontal" verticalSpacing="space60" />
    <Label htmlFor="select_queue_sid">Fila (Queue)</Label>
      <Select
        id="select_queue_sid"
        value={queueSid}
        onChange={e => setQueueSid(e.target.value)}
      >
        {queuesLoading && (
          <Option value="" disabled>Carregando filas...</Option>
        )}
        {!queuesLoading && queueOptions.length === 0 && (
          <Option value="" disabled>
            {fallbackLoading
              ? 'Carregando fallback...'
              : fallbackQueues.length
                ? 'Filas realtime vazias (fallback)'
                : 'Nenhuma fila encontrada'}
          </Option>
        )}
        <Option value="">{queuesLoading ? 'Aguardando filas...' : 'Sem fila (usar padrão)'}</Option>
        {(filteredRealtimeQueues.length ? filteredRealtimeQueues : filteredFallbackQueues).map(q => {
          const label = q.friendlyName || q.queueName || q.sid;
          return <Option key={q.sid} value={q.sid}>{label}</Option>;
        })}
      </Select>
      <HelpText>
        {queuesLoading && 'Consultando filas em tempo real...'}
        {queuesEmptyAfterLoad && !filteredFallbackQueues.length && (fallbackLoading ? 'Nenhuma fila realtime. Buscando fallback...' : filtersActive ? 'Nenhuma fila compatível com este contato.' : 'Nenhuma fila realtime (sem resultado fallback).')}
        {!queuesLoading && filteredRealtimeQueues.length > 0 && 'Se selecionada, a tarefa outbound será roteada por esta fila.'}
      </HelpText>
      <Box marginTop="space30" display="flex" columnGap="space30">
        <Button variant="secondary" size="small" onClick={handleRefreshQueues} disabled={queuesLoading}>
          Recarregar filas
        </Button>
      </Box>
    <Separator orientation="horizontal" verticalSpacing="space60" />
      </Box>
      {/* Rodapé */}
      <Box
        padding="space50"
        borderTopStyle="solid"
        borderTopWidth="borderWidth10"
        borderTopColor="colorBorderWeak"
        backgroundColor="colorBackgroundBody"
        display="flex"
        justifyContent="flex-end"
      >
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          disabled={!contentTemplateSid || isSending}
          loading={isSending}
          onClick={handleSend}
        >
          Enviar WhatsApp
        </Button>
      </Box>
    </Box>
  );
};

export default SendWhatsappSidePanel;
