import { describe, it, expect } from 'vitest';
import {
  isCamera, isCameraIP, isCameraMHD, isCameraWiFi,
  isNVR, isDVR, isGravador,
  isCentralAlarme, isSensorPIR, isBarreira, isSensorZona,
  isSirene, isEletrificador, isTeclado,
  isSwitch, isSwitchPoE,
  isControleAcesso, isIncendio, isCentralIncendio, isDetectorIncendio,
  isAutomatizador,
} from '../../data/validation-rules';

describe('Device classifiers', () => {
  describe('isCamera', () => {
    it('matches cam_ prefixed keys', () => {
      expect(isCamera('cam_bullet')).toBe(true);
      expect(isCamera('cam_ip_dome')).toBe(true);
      expect(isCamera('nvr_32ch')).toBe(false);
    });
  });

  describe('isCameraIP', () => {
    it('matches cam_ip_ but not cam_ip_wifi_', () => {
      expect(isCameraIP('cam_ip_dome')).toBe(true);
      expect(isCameraIP('cam_ip_wifi_outdoor')).toBe(false);
      expect(isCameraIP('cam_lpr')).toBe(true);
    });
  });

  describe('isCameraMHD', () => {
    it('matches cam_mhd_ and cam_hdcvi_', () => {
      expect(isCameraMHD('cam_mhd_dome')).toBe(true);
      expect(isCameraMHD('cam_hdcvi_bullet')).toBe(true);
      expect(isCameraMHD('cam_ip_dome')).toBe(false);
    });
  });

  describe('isCameraWiFi', () => {
    it('matches cam_wifi_ and cam_ip_wifi_', () => {
      expect(isCameraWiFi('cam_wifi_indoor')).toBe(true);
      expect(isCameraWiFi('cam_ip_wifi_ptz')).toBe(true);
      expect(isCameraWiFi('cam_ip_dome')).toBe(false);
    });
  });

  describe('NVR/DVR', () => {
    it('isNVR matches nvr_ prefix and bare nvr', () => {
      expect(isNVR('nvr_32ch')).toBe(true);
      expect(isNVR('nvr')).toBe(true);
      expect(isNVR('dvr_8ch')).toBe(false);
    });
    it('isDVR matches dvr_ prefix', () => {
      expect(isDVR('dvr_8ch')).toBe(true);
      expect(isDVR('nvr')).toBe(false);
    });
    it('isGravador matches both', () => {
      expect(isGravador('nvr_16ch')).toBe(true);
      expect(isGravador('dvr_4ch')).toBe(true);
      expect(isGravador('sw_poe')).toBe(false);
    });
  });

  describe('Alarm', () => {
    it('central, sensor, barreira', () => {
      expect(isCentralAlarme('alarme_intelbras')).toBe(true);
      expect(isSensorPIR('pir_duplo')).toBe(true);
      expect(isBarreira('barreira_ir')).toBe(true);
      expect(isSensorZona('pir_duplo')).toBe(true);
      expect(isSensorZona('barreira_ir')).toBe(true);
      expect(isSensorZona('sensor_abertura')).toBe(true);
    });
    it('sirene excludes sirene_inc_', () => {
      expect(isSirene('sirene_externa')).toBe(true);
      expect(isSirene('sirene_inc_audiovisual')).toBe(false);
    });
  });

  describe('Misc devices', () => {
    it('eletrificador', () => {
      expect(isEletrificador('eletrif_gcp')).toBe(true);
      expect(isEletrificador('eletri_jfl')).toBe(true);
    });
    it('teclado', () => {
      expect(isTeclado('teclado_lcd')).toBe(true);
      expect(isTeclado('sw_8p')).toBe(false);
    });
    it('switch and switchPoE', () => {
      expect(isSwitch('sw_8p')).toBe(true);
      expect(isSwitchPoE('sw_poe')).toBe(true);
      expect(isSwitchPoE('sw_poe_24p')).toBe(true);
      expect(isSwitchPoE('sw_8p')).toBe(false);
    });
  });

  describe('Controle de acesso', () => {
    it('matches access control devices', () => {
      expect(isControleAcesso('leitor_facial')).toBe(true);
      expect(isControleAcesso('controladora')).toBe(true);
      expect(isControleAcesso('fechadura')).toBe(true);
      expect(isControleAcesso('biometrico_digital')).toBe(true);
      expect(isControleAcesso('catraca_pedestre')).toBe(true);
      expect(isControleAcesso('cam_ip_dome')).toBe(false);
    });
  });

  describe('Incendio', () => {
    it('classifies fire devices', () => {
      expect(isIncendio('central_inc_24z')).toBe(true);
      expect(isIncendio('detector_fumaca')).toBe(true);
      expect(isIncendio('acionador_manual')).toBe(true);
      expect(isIncendio('sirene_inc_audiovisual')).toBe(true);
      expect(isIncendio('morley_central')).toBe(true);
      expect(isCentralIncendio('central_inc_24z')).toBe(true);
      expect(isDetectorIncendio('detector_fumaca')).toBe(true);
    });
  });

  describe('Automatizador', () => {
    it('matches motor and cancela', () => {
      expect(isAutomatizador('motor_deslizante')).toBe(true);
      expect(isAutomatizador('cancela_linear')).toBe(true);
      expect(isAutomatizador('motor')).toBe(true);
      expect(isAutomatizador('auto_portao')).toBe(true);
      expect(isAutomatizador('nvr')).toBe(false);
    });
  });
});
