export const MIME_TYPE_JAVASCRIPT = "text/javascript";
export const MIME_TYPE_WASM = "application/wasm";
export const CORE_VERSION = "0.12.9";
export const CORE_URL = (() => {
    // Prefer bundled asset URL when available.
    if (import.meta.env?.VITE_FFMPEG_CORE_URL) {
        return import.meta.env.VITE_FFMPEG_CORE_URL;
    }
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
    const origin = typeof globalThis !== "undefined" && globalThis.location?.origin
        ? globalThis.location.origin
        : "http://localhost";
    const coreBase = new URL("ffmpeg/esm/", new URL(base, origin)).href;
    return `${coreBase}ffmpeg-core.js`;
})();
export var FFMessageType;
(function (FFMessageType) {
    FFMessageType["LOAD"] = "LOAD";
    FFMessageType["EXEC"] = "EXEC";
    FFMessageType["FFPROBE"] = "FFPROBE";
    FFMessageType["WRITE_FILE"] = "WRITE_FILE";
    FFMessageType["READ_FILE"] = "READ_FILE";
    FFMessageType["DELETE_FILE"] = "DELETE_FILE";
    FFMessageType["RENAME"] = "RENAME";
    FFMessageType["CREATE_DIR"] = "CREATE_DIR";
    FFMessageType["LIST_DIR"] = "LIST_DIR";
    FFMessageType["DELETE_DIR"] = "DELETE_DIR";
    FFMessageType["ERROR"] = "ERROR";
    FFMessageType["DOWNLOAD"] = "DOWNLOAD";
    FFMessageType["PROGRESS"] = "PROGRESS";
    FFMessageType["LOG"] = "LOG";
    FFMessageType["MOUNT"] = "MOUNT";
    FFMessageType["UNMOUNT"] = "UNMOUNT";
})(FFMessageType || (FFMessageType = {}));
