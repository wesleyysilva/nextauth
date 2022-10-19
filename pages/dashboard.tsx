
import { useContext, useEffect } from "react";
import { AuthContext, signOut } from "../contexts/AuthContext";
import { api } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {

	const { user } = useContext(AuthContext);

	useEffect(() => {
		api.get('/me').then(response => {
		}).catch(() => {
			signOut();
		});
	}, []);

	return (
		<h1>Dashnboard {user?.email}</h1>
	);
}


export const getServerSideProps = withSSRAuth(async (ctx) => {
	return {
		props: {}
	};
});