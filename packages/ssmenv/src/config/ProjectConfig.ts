/**
 * Configuration specific to the project.
 */
export interface ProjectConfig {
  rootPath: string;
  stages: string[];
}

export type ProjectProperty = keyof ProjectConfig;

export const ProjectRequiredProperties: ProjectProperty[] = [
  'rootPath',
  'stages',
];
