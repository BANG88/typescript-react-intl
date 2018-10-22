/**
 * Represents a react-intl message descriptor
 */
export interface Message {
    defaultMessage: string;
    description?: string;
    id: string;
}
export interface Options {
    tagNames: string[];
}
/**
 * Parse tsx files
 */
declare function main(contents: string, options?: Options): Message[];
export default main;
