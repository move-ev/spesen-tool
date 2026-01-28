import { AuthForm } from "@/components/forms/auth-form";

export default async function ServerPage() {
	return (
		<main className="container flex min-h-svh w-full items-center justify-center">
			<div>
				<h1 className="font-medium text-foreground text-xl">Willkommen zurück!</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Bitte logge dich mit deinem Microsoft Account ein, um fortzufahren.
				</p>
				<AuthForm className="mt-8" />
			</div>
		</main>
	);
}
