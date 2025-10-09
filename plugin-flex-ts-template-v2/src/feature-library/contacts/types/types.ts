export interface Contact {
  key: string;
  areaDeVendas?: string;
  segmento?: string;
  acesso?: string;
  distrito?: string;
  codDistrito?: string;
  funcao?: string;
  codRC?: string;
  name: string;
  email?: string;
  lider?: string;
  rsl?: string;
  myAccessID?: string;
  myAccessIDSeed?: string;
  cnpj?: string;
  filaAtendimentoSemKAMSeeds?: string;
  filaSeedsTwilio?: string;
  filaAtendimentoSemKAMCrop?: string;
  filaCropTwilio?: string;
  agenteKAMSeeds?: string;
  sidSeedsTwilio?: string;
  agenteKAMCrop?: string;
  sidCropTwilio?: string;
  responsavelPelaAtualizacao?: string;
  notes?: string;
  phoneNumber?: string;
  allowColdTransfer?: boolean;
  allowWarmTransfer?: boolean;
}

export interface RawContato {
  [key: string]: string;
}

export interface HistoricalContact {
  taskSid: string;
  direction: string | undefined;
  channelType?: string;
  customerAddress?: string;
  inboundAddress?: string;
  name?: string;
  dateTime: string;
  duration: number;
  queueName: string;
  outcome?: string;
  notes?: string;
}

export interface Message {
  index: number;
  date: string;
  author: string;
  body: string;
}
