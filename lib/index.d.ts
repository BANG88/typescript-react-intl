/**
 * Represents a react-intl message descriptor
 */
export interface Message {
    defaultMessage?: string;
    description?: string;
    id: string;
}
/**
 * Parse tsx files
 */
declare function main(contents: string): Message[];
export default main;
