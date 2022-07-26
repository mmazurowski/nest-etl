export abstract class AbstractOrdersService {
  abstract process(): Promise<void>;
}
