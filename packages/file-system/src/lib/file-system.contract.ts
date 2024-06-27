export class FileSystemError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = FileSystemError.name;
    }
}
export class UnexpectedFileSystemError extends FileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnexpectedFileSystemError.name;
    }
}
export class NotFoundFileSystemError extends FileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = NotFoundFileSystemError.name;
    }
}
export class AlreadyExistsFileSystemError extends FileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = AlreadyExistsFileSystemError.name;
    }
}
export class UnableToDestroyError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToDestroyError.name;
    }
}

export class UnableToChecksumError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToChecksumError.name;
    }
}

export class InvalidPathError extends FileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidPathError.name;
    }
}
export class InvalidCopyDestinationPathError extends InvalidPathError {
    constructor(message: string, cause?: unknown) {
        super(message, cause);
        this.name = InvalidCopyDestinationPathError.name;
    }
}
export class InvalidMoveDestinationPathError extends InvalidPathError {
    constructor(message: string, cause?: unknown) {
        super(message, cause);
        this.name = InvalidMoveDestinationPathError.name;
    }
}

export class UnableToSetVisibilityError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnableToSetVisibilityError.name;
    }
}
export class UnableToGetFileMetadataError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetFileMetadataError.name;
    }
}
export class UnableToGetDirectoryMetadataError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetDirectoryMetadataError.name;
    }
}

export class FileNotFoundError extends NotFoundFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = FileNotFoundError.name;
    }
}
export class FileAlreadyExistsError extends AlreadyExistsFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FileAlreadyExistsError.name;
    }
}

export class UnableToReadFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnableToReadFileError.name;
    }
}
export class UnableToUpdateFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnableToUpdateFileError.name;
    }
}
export class UnableToMoveFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToMoveFileError.name;
    }
}
export class UnableToCopyFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCopyFileError.name;
    }
}
export class UnableToRenameFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRenameFileError.name;
    }
}
export class UnableToRemoveFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveFileError.name;
    }
}
export class UnableToCreateFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCreateFileError.name;
    }
}
export class UnableToApendFileError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToApendFileError.name;
    }
}
export class UnableToCheckFileExistenceError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCheckFileExistenceError.name;
    }
}

export class DirectoryNotFoundError extends NotFoundFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = DirectoryNotFoundError.name;
    }
}
export class DirectoryAlreadyExistsError extends AlreadyExistsFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = DirectoryAlreadyExistsError.name;
    }
}

export class UnableToReadDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnableToReadDirectoryError.name;
    }
}
export class UnableToUpdateDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, {
            cause,
        });
        this.name = UnableToUpdateDirectoryError.name;
    }
}
export class UnableToMoveDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToMoveDirectoryError.name;
    }
}
export class UnableToCopyDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCopyDirectoryError.name;
    }
}
export class UnableToRenameDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRenameDirectoryError.name;
    }
}
export class UnableToRemoveDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveDirectoryError.name;
    }
}
export class UnableToCreateDirectoryError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCreateDirectoryError.name;
    }
}
export class UnableToCheckDirectoryExistenceError extends UnexpectedFileSystemError {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCheckDirectoryExistenceError.name;
    }
}

export const VISIBILITY = {
    PUBLIC: "public",
    PRIVATE: "private",
} as const;
export type TVisibility = (typeof VISIBILITY)[keyof typeof VISIBILITY];

export const RESOURCE = {
    FILE: "file",
    DIRECTORY: "directory",
} as const;
export type TFileSystemResource = (typeof RESOURCE)[keyof typeof RESOURCE];

type IMetadata = {
    readonly id: string;
    readonly name: string;
    readonly path: string;
    readonly createdAt: Date;
    readonly updatedAt: Date | null;
    readonly visibility: TVisibility;
};
export type IFileMetadata = IMetadata & {
    readonly type: (typeof RESOURCE)["FILE"];
    readonly size: number;
    readonly extension: string;
};
export type IDirectoryMetadata = IMetadata & {
    readonly type: (typeof RESOURCE)["DIRECTORY"];
};
export type TFileSystemMetadata = IFileMetadata | IDirectoryMetadata;

export type IWriteFileAsStreamSettings = {
    visibility?: TVisibility;
    replace?: boolean;
    recursive?: boolean;
};
export type IWriteFileSettings = {
    visibility?: TVisibility;
    replace?: boolean;
    recursive?: boolean;
    encoding?: string;
};
export type IUpdateFileSettings = {
    recursive?: boolean;
};
export type ICreateDirectorySettings = {
    visibility?: TVisibility;
    replace?: boolean;
    recursive?: boolean;
};
export type IMoveSettings = {
    replace?: boolean;
    recursive?: boolean;
};
export type ICopySettings = {
    visibility?: TVisibility;
    replace?: boolean;
    recursive?: boolean;
};

export type IFileSystem = {
    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToReadFileError}
     */
    readFileStream(filePath: string): ReadableStream<number>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToReadFileError}
     */
    readFile(filePath: string): Promise<File>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {AlreadyExistsFileSystemError}
     * @throws {FileAlreadyExistsError}
     * @throws {UnableToCreateFileError}
     */
    writeFileStream(
        filePath: string,
        fileStream: WritableStream<number>,
        settings?: IWriteFileAsStreamSettings,
    ): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {AlreadyExistsFileSystemError}
     * @throws {FileAlreadyExistsError}
     * @throws {UnableToCreateFileError}
     */
    writeFile(
        filePath: string,
        file: File,
        settings?: IWriteFileSettings,
    ): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToApendFileError}
     */
    appendFile(filePath: string, fileBuffer: BlobPart[]): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {DirectoryNotFoundError}
     * @throws {UnableToReadDirectoryError}
     */
    readDirectoryStream(path: string): ReadableStream<TFileSystemMetadata>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {AlreadyExistsFileSystemError}
     * @throws {DirectoryAlreadyExistsError}
     * @throws {UnableToCreateDirectoryError}
     */
    createDirectory(
        path: string,
        settings?: ICreateDirectorySettings,
    ): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {UnableToGetFileMetadataError}
     * @throws {FileNotFoundError}
     * @throws {UnableToGetDirectoryMetadataError}
     * @throws {DirectoryNotFoundError}
     */
    metadata(path: string): Promise<TFileSystemMetadata>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {InvalidMoveDestinationPathError}
     * @throws {FileNotFoundError}
     * @throws {AlreadyExistsFileSystemError}
     * @throws {FileAlreadyExistsError}
     * @throws {UnableToMoveFileError}
     * @throws {NotFoundFileSystemError}
     * @throws {DirectoryNotFoundError}
     * @throws {DirectoryAlreadyExistsError}
     * @throws {UnableToMoveDirectoryError}
     */
    move(
        sourceDestinationPath: string,
        destinationPath: string,
        settings?: IMoveSettings,
    ): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {InvalidCopyDestinationPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {AlreadyExistsFileSystemError}
     * @throws {FileAlreadyExistsError}
     * @throws {UnableToCopyFileError}
     * @throws {DirectoryNotFoundError}
     * @throws {DirectoryAlreadyExistsError}
     * @throws {UnableToCopyDirectoryError}
     */
    copy(
        sourceDestinationPath: string,
        destinationPath: string,
        settings?: ICopySettings,
    ): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {UnableToCheckFileExistenceError}
     * @throws {UnableToCheckDirectoryExistenceError}
     */
    has(path: string): Promise<boolean>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToRemoveFileError}
     * @throws {DirectoryNotFoundError}
     * @throws {UnableToRemoveDirectoryError}
     */
    remove(path: string): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToRenameFileError}
     * @throws {DirectoryNotFoundError}
     * @throws {UnableToRenameDirectoryError}
     */
    rename(path: string, name: string): Promise<void>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {UnableToSetVisibilityError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {DirectoryNotFoundError}
     */
    setVisibility(path: string, visibility: TVisibility): Promise<void>;

    /**
     * Will remove the whole filesystem
     * @throws {UnableToDestroyError}
     */
    clear(): Promise<void>;
};

export type IChecksum = {
    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     * @throws {UnableToChecksumError}
     */
    checksum(filePath: string): Promise<string>;
};

export type IPublicUrlGenerator = {
    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     */
    generateUrl(filePath: string): Promise<string>;

    /**
     * @throws {FileSystemError}
     * @throws {UnexpectedFileSystemError}
     * @throws {InvalidPathError}
     * @throws {NotFoundFileSystemError}
     * @throws {FileNotFoundError}
     */
    revokeUrl(filePath: string): Promise<void>;
};
