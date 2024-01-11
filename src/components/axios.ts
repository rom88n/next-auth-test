import axios, { InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const ApiClient = () => {
  const apiCaller = axios.create({
    baseURL: '/',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  apiCaller.interceptors.request.use(async (request) => {
    if (request.headers.Authorization) return request

    const session = await getSession()

    if (session) {
      const authHeaderValue = `Bearer ${session.access_token}`

      request.headers.Authorization = authHeaderValue
      apiCaller.defaults.headers.common.Authorization = authHeaderValue
    }

    return request
  })

  apiCaller.interceptors.response.use(
    (response) => response,
    async (error) => {

      // apiCaller.defaults.headers.common.Authorization = undefined
      // await signOut({ callbackUrl: '/' })

      return Promise.reject(error)
    },
  )

  return apiCaller
}

export const apiCaller = ApiClient()

export default apiCaller;
