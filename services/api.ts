import axios, { AxiosError } from 'axios';

import { parseCookies, setCookie as set_Cookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

interface AxiosErrorResponse {
	code?: string;
}

let cookies = parseCookies();

let isRefreshing = false;

let failedRequestQueue = [];

export const api = axios.create({
	baseURL: "http://localhost:3333",
	headers: {
		Authorization: `Bearer ${cookies['nextauth.token']}`
	}
});

api.interceptors.response.use(response => {
	return response;
}, (error: AxiosError<AxiosErrorResponse>) => {

	if (error.response?.status === 401) {
		if (error.response.data?.code === 'token.expired') {

			cookies = parseCookies();

			const { 'nextauth.refreshToken': refreshToken } = cookies;
			const originalConfig = error.config;

			if (!isRefreshing) {
				isRefreshing = true;

				api.post('/refresh', {
					refreshToken
				}).then(response => {

					const { token } = response.data;

					set_Cookie(undefined, 'nextauth.token', token, {
						maxAge: 60 * 60 * 24 * 30,
						path: '/'
					});

					set_Cookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
						maxAge: 60 * 60 * 24 * 30,
						path: '/'
					});

					//api.defaults.headers['Authorization'] = `Bearer ${token}`;
					api.defaults.headers.common.Authorization = `Bearer ${token}`;

					failedRequestQueue.forEach(request => request.onSuccess(token));
					failedRequestQueue = [];

				}).catch(err => {
					failedRequestQueue.forEach(request => request.onFailure(err));
					failedRequestQueue = [];

				}).finally(() => {
					isRefreshing = false;
				});
			}

			return new Promise((resolve, reject) => {

				failedRequestQueue.push({
					onSuccess: (token: string) => {
						originalConfig.headers.Authorization = `Bearer ${token}`;
						resolve(api(originalConfig));
					},
					onFailure: (err: AxiosError) => {
						reject(err);
					}
				});
			});

		} else {
			signOut();
		}
	}

	return Promise.reject(error);
});