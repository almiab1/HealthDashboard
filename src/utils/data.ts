export interface RegistroCorporalRaw {
  Fecha: string;
  Peso: number;
  IMC: number;
  GrasaKg: number;
  GrasaPorc: number;
  MasaLibreKg: number;
  MusculoKg: number;
  AguaKg: number;
  AguaPorc: number;
  MetabolismoBasal: number;
  EdadMetabolica: number;
  GrasaVisceral: number;
  MasaOsea: number;
  AnguloFase: number;
  Resistencia: number;
  Reactancia: number;
}

export interface RegistroCorporal extends Omit<RegistroCorporalRaw, 'Fecha'> {
  Fecha: Date;
}
