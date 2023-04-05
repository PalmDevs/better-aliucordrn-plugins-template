export default function pascalCaseToKebabCase(string: string) {
    return string.replace(/[A-Z]/g, (letter, index) =>
        !index ? letter.toLowerCase() : `-${letter.toLowerCase()}`
    );
}
