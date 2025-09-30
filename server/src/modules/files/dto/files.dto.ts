export class MoveFileDto {
  filename: string;
}

export class BrowseFilesDto {
  path?: string;
}

export class FileItem {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  modTime?: string;
}

export class BrowseFilesResponse {
  success: boolean;
  data: {
    path: string;
    items: FileItem[];
  };
}

export class MoveFileResponse {
  success: boolean;
  message: string;
  source: string;
  destination: string;
}