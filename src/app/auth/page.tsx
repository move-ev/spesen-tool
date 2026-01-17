import { LoginForm } from "@/components/forms/login-form";

export default async function ServerPage() {
	return (
		<main className="flex min-h-svh w-full items-center justify-center">
			<div>
				<h1 className="font-medium text-foreground text-xl">Willkommen zurück!</h1>
				<p className="mt-2 text-muted-foreground text-sm">
					Bitte logge dich mit deinem Microsoft Account ein, um fortzufahren.
				</p>
				<LoginForm className="mt-8" />
			</div>
		</main>
	);
}
