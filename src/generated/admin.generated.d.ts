/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types';

export type GetCustomersQueryVariables = AdminTypes.Exact<{
  first: AdminTypes.Scalars['Int']['input'];
  after?: AdminTypes.InputMaybe<AdminTypes.Scalars['String']['input']>;
}>;


export type GetCustomersQuery = { customers: { edges: Array<{ node: Pick<AdminTypes.Customer, 'id' | 'email' | 'firstName' | 'lastName' | 'numberOfOrders' | 'tags'> }>, pageInfo: Pick<AdminTypes.PageInfo, 'hasNextPage' | 'endCursor'> } };

export type UpdateCustomerMutationVariables = AdminTypes.Exact<{
  input: AdminTypes.CustomerInput;
}>;


export type UpdateCustomerMutation = { customerUpdate?: AdminTypes.Maybe<{ customer?: AdminTypes.Maybe<Pick<AdminTypes.Customer, 'id' | 'tags'>>, userErrors: Array<Pick<AdminTypes.UserError, 'field' | 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n      query GetCustomers($first: Int!, $after: String) {\n        customers(first: $first, after: $after) {\n          edges {\n            node {\n              id\n              email\n              firstName\n              lastName\n              numberOfOrders\n              tags\n            }\n          }\n          pageInfo {\n            hasNextPage\n            endCursor\n          }\n        }\n      }\n    ": {return: GetCustomersQuery, variables: GetCustomersQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n      mutation UpdateCustomer($input: CustomerInput!) {\n        customerUpdate(input: $input) {\n          customer {\n            id\n            tags\n          }\n          userErrors {\n            field\n            message\n          }\n        }\n      }\n    ": {return: UpdateCustomerMutation, variables: UpdateCustomerMutationVariables},
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
