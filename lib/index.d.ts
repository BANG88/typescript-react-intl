/**
 * Represents a react-intl message descriptor
 */
export interface Message {
    id: string;
    defaultMessage: string;
    description?: string;
    [key: string]: string | undefined;
}
/**
 * Parse tsx files
 */
declare function main(contents: string): Message[];
export default main;
