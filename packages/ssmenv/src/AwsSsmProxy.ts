import { AWSError, SSM } from 'aws-sdk';
import {
  AddTagsOptions,
  AddTagsResponse,
  Configuration,
  DeleteOptions,
  DeleteResponse,
  GetParametersOptions,
  GetParametersResponse,
  PutOptions,
  PutResponse,
} from './AwsSsmTypes';

/** Type alias for `T` or `undefined`. */
type Nullable<T> = T | null;
/** Parameterized type alias for a callback that receives an error or a result. */
type CB<E extends Error, T> = (err: Nullable<E>, res: T) => void;
/** Parameterized type alias for function that takes a request and a CB. */
type Promisable<Req, Res> = (req: Req, callback: CB<AWSError, Res>) => void;

/**
 * Proxies select methods of `AWS.SSM` using functions that return `Promise`
 * instances rather than following the callback pattern.
 */
export class AwsSsmProxy {
  addTagsToResource: (request: AddTagsOptions) => Promise<AddTagsResponse>;
  deleteParameters: (request: DeleteOptions) => Promise<DeleteResponse>;
  getParametersByPath: (
    request: GetParametersOptions
  ) => Promise<GetParametersResponse>;
  putParameter: (request: PutOptions) => Promise<PutResponse>;

  /**
   * Construct a proxy by using credentials or the configured instance.
   * @param config to use when accessing AWS API or the configured `SSM`
   *    instance.
   */
  constructor(config: SSM | Configuration) {
    const ssm = config instanceof SSM ? config : new SSM(config);
    this.addTagsToResource = this.promisify(ssm.addTagsToResource.bind(ssm));
    this.deleteParameters = this.promisify(ssm.deleteParameters.bind(ssm));
    this.getParametersByPath = this.promisify(
      ssm.getParametersByPath.bind(ssm)
    );
    this.putParameter = this.promisify(ssm.putParameter.bind(ssm));
  }

  /**
   * Convert a function that expects a callback into a function that returns
   * a Promise.
   * @param Req type accepted as an argument to the new function.
   * @param Res type the new function's Promise will resolve to.
   * @param fn to promisify.
   * @param a function accepting a `Req` parameter and returning a
   *    `Promise<Res>` result.
   */
  private promisify<Req, Res>(fn: Promisable<Req, Res>) {
    return (request: Req) => {
      return new Promise<Res>((resolve, reject) => {
        fn(request, (error: Nullable<AWSError>, response: Res) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
    };
  }
}
