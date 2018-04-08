import { AWSError, SSM } from 'aws-sdk';

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
  addTagsToResource: (
    request: SSM.AddTagsToResourceRequest
  ) => Promise<SSM.AddTagsToResourceResult>;
  getParametersByPath: (
    request: SSM.GetParametersByPathRequest
  ) => Promise<SSM.GetParametersByPathResult>;
  putParameter: (
    request: SSM.PutParameterRequest
  ) => Promise<SSM.PutParameterResult>;

  constructor(ssm: SSM) {
    this.addTagsToResource = this.promisify(ssm.addTagsToResource.bind(ssm));
    this.getParametersByPath = this.promisify(
      ssm.getParametersByPath.bind(ssm)
    );
    this.putParameter = this.promisify(ssm.putParameter.bind(ssm));
  }

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
