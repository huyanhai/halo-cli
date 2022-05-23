/**
 * 清除控制台内容
 */
export declare const cleanConsole: () => void;
/**
 * 下载模板
 * @param url
 * @param pathName
 * @param clone
 * @param cb
 */
export declare const downloadTemplate: (url: string, pathName: string, clone: boolean | undefined, cb: () => void) => Promise<void>;
export declare const install: (option: {
    cwd: string;
    tool: string;
}) => Promise<unknown>;
