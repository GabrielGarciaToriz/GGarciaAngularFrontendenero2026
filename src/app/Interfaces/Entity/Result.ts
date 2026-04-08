export interface Result<T = any> {
    correct: boolean;
    errorMessage?: string;
    object?: T;
    objects: T[];

}