import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogBody,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";

const meta = {
	title: "Components/AlertDialog",
	component: AlertDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		open: {
			control: "boolean",
		},
	},

	render: (args) => (
		<AlertDialog {...args}>
			<AlertDialogTrigger
				render={<Button variant="outline">Show Dialog</Button>}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account
						from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSmallBody: Story = {
	render: (args) => (
		<AlertDialog {...args}>
			<AlertDialogTrigger
				render={<Button variant="outline">Show Dialog</Button>}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account
						from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogBody>
					<p>
						Lorem ipsum, dolor sit amet consectetur adipisicing elit. Labore tempore
						doloremque quos, veritatis repellendus quis eum ex qui distinctio nam,
						nihil placeat culpa iure perferendis asperiores omnis totam voluptatibus
						quas. Eius nulla repellat molestias rerum quia nostrum a aliquid aperiam,
						id dolor vel architecto quis illo accusantium rem voluptas sit voluptatum,
						minus modi fugit eveniet voluptates non! Similique, alias numquam!
					</p>
				</AlertDialogBody>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};

export const WithLargeBody: Story = {
	render: (args) => (
		<AlertDialog {...args}>
			<AlertDialogTrigger
				render={<Button variant="outline">Show Dialog</Button>}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your account
						from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogBody>
					<p>
						Lorem ipsum, dolor sit amet consectetur adipisicing elit. Labore tempore
						doloremque quos, veritatis repellendus quis eum ex qui distinctio nam,
						nihil placeat culpa iure perferendis asperiores omnis totam voluptatibus
						quas. Eius nulla repellat molestias rerum quia nostrum a aliquid aperiam,
						id dolor vel architecto quis illo accusantium rem voluptas sit voluptatum,
						minus modi fugit eveniet voluptates non! Similique, alias numquam! Ullam
						alias totam corporis. Excepturi voluptas est quod, ipsa tempore incidunt
						dicta magnam natus laudantium blanditiis minus vero iusto inventore
						quisquam molestias iste enim doloremque, deserunt adipisci? Doloremque,
						modi quam! Non ut et sint architecto eius, porro ipsum beatae! Ut optio
						sapiente tempore sequi amet, praesentium ex, assumenda ea fuga laboriosam
						dolorem doloribus consequatur! Quas dicta fuga enim placeat earum. Ratione
						sequi omnis rerum voluptatem nam modi, enim quibusdam cupiditate
						reprehenderit eius tempora, quidem labore eveniet, laboriosam veritatis
						nobis cumque odio quasi corrupti at optio aperiam. Error ipsam cupiditate
						porro! Dolor ipsam nam vero praesentium tenetur explicabo quae totam. Ipsa
						vitae, exercitationem molestiae aspernatur perferendis voluptatem maxime
						iste necessitatibus fuga sint tempora sed commodi modi nulla, pariatur
						dolores rem suscipit! Nesciunt, hic debitis repellat rem odio a mollitia
						aliquid praesentium nihil tenetur. Nesciunt doloribus facilis nihil quo
						voluptatem, rem natus veniam maxime minus. Repellendus autem cum iure
						consequatur eveniet nemo. Laudantium quod, odit error molestiae provident
						voluptatibus aliquam recusandae temporibus illum laborum eum incidunt
						officiis porro tenetur, iure possimus, sunt aperiam nemo perspiciatis
						iusto. Officia velit minus molestias laudantium sit. Voluptate suscipit,
						aliquam architecto maiores, alias vitae incidunt nesciunt ipsam, obcaecati
						numquam et praesentium maxime? Nihil ad omnis cumque, quasi eligendi non
						aut quos distinctio explicabo consequatur itaque accusamus excepturi. Amet
						voluptates maxime odit animi? Distinctio dignissimos voluptas fugit ea
						incidunt qui praesentium cumque ex quasi tempore voluptatibus, inventore
						alias a, architecto accusamus enim unde quisquam. Nulla consectetur
						tenetur veniam!
					</p>
				</AlertDialogBody>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};
