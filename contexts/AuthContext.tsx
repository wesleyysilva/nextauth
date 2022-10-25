import { parseCookies, setCookie as set_Cookie, destroyCookie } from 'nookies';
import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
	email: string;
	permissions: string[];
	roles: string[];
};

type SignInCredentials = {
	email: string;
	password: string;
};

type AuthProviderProps = {
	children: ReactNode;
};

type AuthContextData = {
	signIn(credential: SignInCredentials): Promise<void>;
	user: User;
	isAuthenticated: boolean;
};

export const AuthContext = createContext({} as AuthContextData);

export function signOut() {
	destroyCookie(undefined, 'nextauth.token');
	destroyCookie(undefined, 'nextauth.refreshToken');

	Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {

	const [user, setUser] = useState<User>();
	const isAuthenticated = !!user;

	useEffect(() => {

		const { 'nextauth.token': token } = parseCookies();

		if (token) {

			api.get('/me').then(response => {

				const { email, permissions, roles } = response.data;

				setUser({ email, permissions, roles });

			}).catch(() => {
				signOut();
			});

		}

	}, []);

	async function signIn({ email, password }: SignInCredentials) {
		try {

			const response = await api.post('/sessions', {
				email,
				password,

			});

			const { token, refreshToken, permissions, roles } = response.data;

			set_Cookie(undefined, 'nextauth.token', token, {
				maxAge: 60 * 60 * 24 * 30,
				path: '/'
			});

			set_Cookie(undefined, 'nextauth.refreshToken', refreshToken, {
				maxAge: 60 * 60 * 24 * 30,
				path: '/'
			});

			setUser({
				email,
				permissions,
				roles
			});

			api.defaults.headers['Authorization'] = `Bearer ${token}`;

			Router.push('/dashboard');

		} catch (err) {

			const { message, code, name } = err;

			console.log({ message, code, name });
		}
	}

	return (
		<AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
			{children}
		</AuthContext.Provider>
	);
}

function setCookie() {
	throw new Error("Function not implemented.");
}
