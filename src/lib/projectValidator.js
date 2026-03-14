// ====================================================================
// PROJECT VALIDATOR — validate imported/loaded project data structure
// ====================================================================

const MAX_FLOORS = 50;
const MAX_DEVICES_PER_FLOOR = 1000;
const MAX_CONNECTIONS_PER_FLOOR = 5000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate project data structure for import safety.
 * Returns { valid: boolean, errors: string[], project: object|null }
 */
export function validateProjectData(data, fileSize = 0) {
  const errors = [];

  // File size check
  if (fileSize > MAX_FILE_SIZE) {
    errors.push(`Arquivo muito grande (${Math.round(fileSize / 1024 / 1024)}MB). Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    return { valid: false, errors, project: null };
  }

  // Extract project from wrapper or direct
  let project;
  if (data && data._format === 'bim-protector' && data.project) {
    project = data.project;
  } else if (data && data.floors && data.name) {
    project = data;
  } else {
    errors.push('Formato de arquivo inválido: esperado projeto BIM Protector');
    return { valid: false, errors, project: null };
  }

  // Required fields
  if (!project.name || typeof project.name !== 'string') {
    errors.push('Projeto sem nome válido');
  }

  if (!Array.isArray(project.floors)) {
    errors.push('Projeto sem lista de andares (floors)');
    return { valid: false, errors, project: null };
  }

  // Floor limits
  if (project.floors.length > MAX_FLOORS) {
    errors.push(`Projeto tem ${project.floors.length} andares. Máximo: ${MAX_FLOORS}`);
  }

  // Validate each floor
  project.floors.forEach((floor, i) => {
    const floorLabel = floor.name || `Andar ${i}`;

    if (!floor.id || typeof floor.id !== 'string') {
      errors.push(`${floorLabel}: sem ID válido`);
    }

    // Device limits
    const devices = floor.devices || [];
    if (!Array.isArray(devices)) {
      errors.push(`${floorLabel}: devices não é array`);
    } else if (devices.length > MAX_DEVICES_PER_FLOOR) {
      errors.push(`${floorLabel}: ${devices.length} dispositivos. Máximo: ${MAX_DEVICES_PER_FLOOR}`);
    } else {
      // Validate device structure
      devices.forEach((dev, j) => {
        if (typeof dev.x !== 'number' || typeof dev.y !== 'number') {
          errors.push(`${floorLabel}, device ${j}: coordenadas x/y inválidas`);
        }
        if (isNaN(dev.x) || isNaN(dev.y)) {
          errors.push(`${floorLabel}, device ${j}: coordenadas NaN`);
        }
      });
    }

    // Connection limits
    const connections = floor.connections || [];
    if (!Array.isArray(connections)) {
      errors.push(`${floorLabel}: connections não é array`);
    } else if (connections.length > MAX_CONNECTIONS_PER_FLOOR) {
      errors.push(`${floorLabel}: ${connections.length} conexões. Máximo: ${MAX_CONNECTIONS_PER_FLOOR}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    project,
  };
}
