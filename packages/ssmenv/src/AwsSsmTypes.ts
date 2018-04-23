import { SSM } from 'aws-sdk';

/* tslint:disable no-empty-interface */
export type AddTagsOptions = SSM.AddTagsToResourceRequest;
export type AddTagsResponse = SSM.AddTagsToResourceResult;
export type Configuration = SSM.ClientConfiguration;
export type DeleteOptions = SSM.DeleteParametersRequest;
export type DeleteResponse = SSM.DeleteParametersResult;
export type GetParametersOptions = SSM.GetParametersByPathRequest;
export type GetParametersResponse = SSM.GetParametersByPathResult;
export type PutOptions = SSM.PutParameterRequest;
export type PutResponse = SSM.PutParameterResult;
/* tslint:enable no-empty-interface */
