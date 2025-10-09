import { useEffect, useState } from 'react';
import { Template, templates } from '@twilio/flex-ui';
import { Button } from '@twilio-paste/core/button';
import { Input } from '@twilio-paste/core/input';
import { Switch } from '@twilio-paste/core/switch';
import { useUIDSeed } from '@twilio-paste/core/uid-library';
import { Modal, ModalBody, ModalFooter, ModalFooterActions, ModalHeader, ModalHeading } from '@twilio-paste/core/modal';
import { Label } from '@twilio-paste/core/label';
import { Form, FormControl } from '@twilio-paste/core/form';
import { TextArea } from '@twilio-paste/core/textarea';

import { StringTemplates } from '../../flex-hooks/strings/strings';
import { Contact } from '../../types/types';
import ContactsUtil from '../../utils/ContactsUtil';

interface Props {
  contact: Contact | null;
  isOpen: boolean;
  shared: boolean;
  handleClose: () => void;
}

const ContactEditModal = ({ contact, isOpen, shared, handleClose }: Props) => {
  const [name, setName] = useState(contact?.name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [areaDeVendas, setAreaDeVendas] = useState(contact?.areaDeVendas ?? '');
  const [segmento, setSegmento] = useState(contact?.segmento ?? '');
  const [acesso, setAcesso] = useState(contact?.acesso ?? '');
  const [distrito, setDistrito] = useState(contact?.distrito ?? '');
  const [codDistrito, setCodDistrito] = useState(contact?.codDistrito ?? '');
  const [funcao, setFuncao] = useState(contact?.funcao ?? '');
  const [codRC, setCodRC] = useState(contact?.codRC ?? '');
  const [lider, setLider] = useState(contact?.lider ?? '');
  const [rsl, setRsl] = useState(contact?.rsl ?? '');
  const [myAccessID, setMyAccessID] = useState(contact?.myAccessID ?? '');
  const [myAccessIDSeed, setMyAccessIDSeed] = useState(contact?.myAccessIDSeed ?? '');
  const [cnpj, setCnpj] = useState(contact?.cnpj ?? '');
  const [filaAtendimentoSemKAMSeeds, setFilaAtendimentoSemKAMSeeds] = useState(contact?.filaAtendimentoSemKAMSeeds ?? '');
  const [filaSeedsTwilio, setFilaSeedsTwilio] = useState(contact?.filaSeedsTwilio ?? '');
  const [filaAtendimentoSemKAMCrop, setFilaAtendimentoSemKAMCrop] = useState(contact?.filaAtendimentoSemKAMCrop ?? '');
  const [filaCropTwilio, setFilaCropTwilio] = useState(contact?.filaCropTwilio ?? '');
  const [agenteKAMSeeds, setAgenteKAMSeeds] = useState(contact?.agenteKAMSeeds ?? '');
  const [sidSeedsTwilio, setSidSeedsTwilio] = useState(contact?.sidSeedsTwilio ?? '');
  const [agenteKAMCrop, setAgenteKAMCrop] = useState(contact?.agenteKAMCrop ?? '');
  const [sidCropTwilio, setSidCropTwilio] = useState(contact?.sidCropTwilio ?? '');
  const [responsavelPelaAtualizacao, setResponsavelPelaAtualizacao] = useState(contact?.responsavelPelaAtualizacao ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [allowColdTransfer, setAllowColdTransfer] = useState(contact?.allowColdTransfer ?? true);
  const [allowWarmTransfer, setAllowWarmTransfer] = useState(contact?.allowWarmTransfer ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const seed = useUIDSeed();
  const isNew = !Boolean(contact);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setPhoneNumber('');
  setEmail('');
  setAreaDeVendas('');
  setSegmento('');
  setAcesso('');
  setDistrito('');
  setCodDistrito('');
  setFuncao('');
  setCodRC('');
  setLider('');
  setRsl('');
  setMyAccessID('');
  setMyAccessIDSeed('');
  setCnpj('');
  setFilaAtendimentoSemKAMSeeds('');
  setFilaSeedsTwilio('');
  setFilaAtendimentoSemKAMCrop('');
  setFilaCropTwilio('');
  setAgenteKAMSeeds('');
  setSidSeedsTwilio('');
  setAgenteKAMCrop('');
  setSidCropTwilio('');
  setResponsavelPelaAtualizacao('');
  setNotes('');
      setAllowColdTransfer(true);
      setAllowWarmTransfer(true);
    }
  }, [isOpen]);

  useEffect(() => {
    setName(contact?.name ?? '');
    setPhoneNumber(contact?.phoneNumber ?? '');
  setEmail(contact?.email ?? '');
  setAreaDeVendas(contact?.areaDeVendas ?? '');
  setSegmento(contact?.segmento ?? '');
  setAcesso(contact?.acesso ?? '');
  setDistrito(contact?.distrito ?? '');
  setCodDistrito(contact?.codDistrito ?? '');
  setFuncao(contact?.funcao ?? '');
  setCodRC(contact?.codRC ?? '');
  setLider(contact?.lider ?? '');
  setRsl(contact?.rsl ?? '');
  setMyAccessID(contact?.myAccessID ?? '');
  setMyAccessIDSeed(contact?.myAccessIDSeed ?? '');
  setCnpj(contact?.cnpj ?? '');
  setFilaAtendimentoSemKAMSeeds(contact?.filaAtendimentoSemKAMSeeds ?? '');
  setFilaSeedsTwilio(contact?.filaSeedsTwilio ?? '');
  setFilaAtendimentoSemKAMCrop(contact?.filaAtendimentoSemKAMCrop ?? '');
  setFilaCropTwilio(contact?.filaCropTwilio ?? '');
  setAgenteKAMSeeds(contact?.agenteKAMSeeds ?? '');
  setSidSeedsTwilio(contact?.sidSeedsTwilio ?? '');
  setAgenteKAMCrop(contact?.agenteKAMCrop ?? '');
  setSidCropTwilio(contact?.sidCropTwilio ?? '');
  setResponsavelPelaAtualizacao(contact?.responsavelPelaAtualizacao ?? '');
  setNotes(contact?.notes ?? '');
    setAllowColdTransfer(contact?.allowColdTransfer ?? true);
    setAllowWarmTransfer(contact?.allowWarmTransfer ?? true);
  }, [contact]);

  const save = async () => {
    setIsSaving(true);
    if (isNew) {
      await ContactsUtil.addContact(name, phoneNumber, notes, shared, allowColdTransfer, allowWarmTransfer);
    } else if (contact) {
      const newContact = {
        ...contact,
  name,
  phoneNumber,
  email,
  areaDeVendas,
  segmento,
  acesso,
  distrito,
  codDistrito,
  funcao,
  codRC,
  lider,
  rsl,
  myAccessID,
  myAccessIDSeed,
  cnpj,
  filaAtendimentoSemKAMSeeds,
  filaSeedsTwilio,
  filaAtendimentoSemKAMCrop,
  filaCropTwilio,
  agenteKAMSeeds,
  sidSeedsTwilio,
  agenteKAMCrop,
  sidCropTwilio,
  responsavelPelaAtualizacao,
  notes,
      };
      if (shared) {
        newContact.allowColdTransfer = allowColdTransfer;
        newContact.allowWarmTransfer = allowWarmTransfer;
      }
      await ContactsUtil.updateContact(newContact, shared);
    }
    handleClose();
    setIsSaving(false);
  };

  return (
    <Modal ariaLabelledby={seed('modal-heading')} isOpen={isOpen} onDismiss={handleClose} size="default">
      <ModalHeader>
        <ModalHeading as="h3" id={seed('modal-heading')}>
          <Template source={templates[isNew ? StringTemplates.ContactAdd : StringTemplates.ContactEdit]} />
        </ModalHeading>
      </ModalHeader>
      <ModalBody>
        <Form>
          <FormControl>
            <Label htmlFor={seed('name')} required>
              <Template source={templates[StringTemplates.ContactName]} />
            </Label>
            <Input
              type="text"
              id={seed('name')}
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <Label htmlFor={seed('email')}>Email</Label>
            <Input
              type="email"
              id={seed('email')}
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <Label htmlFor={seed('areaDeVendas')}>Área de Vendas</Label>
            <Input
              type="text"
              id={seed('areaDeVendas')}
              name="areaDeVendas"
              value={areaDeVendas}
              onChange={(e) => setAreaDeVendas(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <Label htmlFor={seed('segmento')}>Segmento</Label>
            <Input
              type="text"
              id={seed('segmento')}
              name="segmento"
              value={segmento}
              onChange={(e) => setSegmento(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <Label htmlFor={seed('phone-number')} required>
              <Template source={templates[StringTemplates.ContactPhoneNumber]} />
            </Label>
            <Input
              type="tel"
              id={seed('phone-number')}
              name="phone-number"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </FormControl>
          {/* Extra fields */}
          <FormControl><Label htmlFor={seed('acesso')}>Acesso</Label><Input type="text" id={seed('acesso')} value={acesso} onChange={e=>setAcesso(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('distrito')}>Distrito</Label><Input type="text" id={seed('distrito')} value={distrito} onChange={e=>setDistrito(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('codDistrito')}>Cod Distrito</Label><Input type="text" id={seed('codDistrito')} value={codDistrito} onChange={e=>setCodDistrito(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('funcao')}>Função</Label><Input type="text" id={seed('funcao')} value={funcao} onChange={e=>setFuncao(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('codRC')}>Cod RC</Label><Input type="text" id={seed('codRC')} value={codRC} onChange={e=>setCodRC(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('lider')}>Líder</Label><Input type="text" id={seed('lider')} value={lider} onChange={e=>setLider(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('rsl')}>RSL</Label><Input type="text" id={seed('rsl')} value={rsl} onChange={e=>setRsl(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('myAccessID')}>myAccess ID</Label><Input type="text" id={seed('myAccessID')} value={myAccessID} onChange={e=>setMyAccessID(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('myAccessIDSeed')}>myAccess ID Seed</Label><Input type="text" id={seed('myAccessIDSeed')} value={myAccessIDSeed} onChange={e=>setMyAccessIDSeed(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('cnpj')}>CNPJ</Label><Input type="text" id={seed('cnpj')} value={cnpj} onChange={e=>setCnpj(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('filaAtendimentoSemKAMSeeds')}>Fila Atendimento s/ KAM SEEDS</Label><Input type="text" id={seed('filaAtendimentoSemKAMSeeds')} value={filaAtendimentoSemKAMSeeds} onChange={e=>setFilaAtendimentoSemKAMSeeds(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('filaSeedsTwilio')}>Fila SEEDS Twilio</Label><Input type="text" id={seed('filaSeedsTwilio')} value={filaSeedsTwilio} onChange={e=>setFilaSeedsTwilio(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('filaAtendimentoSemKAMCrop')}>Fila Atendimento s/ KAM CROP</Label><Input type="text" id={seed('filaAtendimentoSemKAMCrop')} value={filaAtendimentoSemKAMCrop} onChange={e=>setFilaAtendimentoSemKAMCrop(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('filaCropTwilio')}>Fila CROP Twilio</Label><Input type="text" id={seed('filaCropTwilio')} value={filaCropTwilio} onChange={e=>setFilaCropTwilio(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('agenteKAMSeeds')}>Agente KAM Seeds</Label><Input type="text" id={seed('agenteKAMSeeds')} value={agenteKAMSeeds} onChange={e=>setAgenteKAMSeeds(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('sidSeedsTwilio')}>SID Seeds Twilio</Label><Input type="text" id={seed('sidSeedsTwilio')} value={sidSeedsTwilio} onChange={e=>setSidSeedsTwilio(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('agenteKAMCrop')}>Agente KAM Crop</Label><Input type="text" id={seed('agenteKAMCrop')} value={agenteKAMCrop} onChange={e=>setAgenteKAMCrop(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('sidCropTwilio')}>SID Crop Twilio</Label><Input type="text" id={seed('sidCropTwilio')} value={sidCropTwilio} onChange={e=>setSidCropTwilio(e.target.value)} /></FormControl>
          <FormControl><Label htmlFor={seed('responsavelPelaAtualizacao')}>Responsável pela atualização</Label><Input type="text" id={seed('responsavelPelaAtualizacao')} value={responsavelPelaAtualizacao} onChange={e=>setResponsavelPelaAtualizacao(e.target.value)} /></FormControl>
          <FormControl>
            <Label htmlFor={seed('notes')}>
              <Template source={templates[StringTemplates.ContactNotes]} />
            </Label>
            <TextArea id={seed('notes')} name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormControl>
          {ContactsUtil.shouldShowTransferOptions(shared) && (
            <>
              <FormControl>
                <Switch
                  checked={allowColdTransfer}
                  onChange={(e) => setAllowColdTransfer(e.target.checked)}
                  id={seed('allow-cold-transfer')}
                  name={'allow-cold-transfer'}
                >
                  <Template source={templates[StringTemplates.AllowColdTransfer]} />
                </Switch>
              </FormControl>
              <FormControl>
                <Switch
                  checked={allowWarmTransfer}
                  onChange={(e) => setAllowWarmTransfer(e.target.checked)}
                  id={seed('allow-warm-transfer')}
                  name={'allow-warm-transfer'}
                >
                  <Template source={templates[StringTemplates.AllowWarmTransfer]} />
                </Switch>
              </FormControl>
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <ModalFooterActions>
          <Button variant="secondary" onClick={handleClose}>
            <Template source={templates.Cancel} />
          </Button>
          <Button variant="primary" onClick={save} disabled={!name || !phoneNumber} loading={isSaving}>
            <Template source={templates.Save} />
          </Button>
        </ModalFooterActions>
      </ModalFooter>
    </Modal>
  );
};

export default ContactEditModal;
