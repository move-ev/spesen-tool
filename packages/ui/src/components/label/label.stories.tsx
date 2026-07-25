import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";
import { Label } from "./label";

const meta = {
	title: "Components/Label",
	component: Label,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {},
	args: {},
	render: (args) => (
		<div className="grid gap-2">
			<Label htmlFor="sample-input-5423" {...args}>
				Name
			</Label>
			<Input id="sample-input-5423" placeholder="John Schuster" />
		</div>
	),
} satisfies Meta<React.ComponentProps<typeof Label>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
	render: (args) => (
		<div className="grid gap-2">
			<Label htmlFor="sample-input-5431" {...args}>
				Name
			</Label>
			<Input disabled id="sample-input-5431" placeholder="John Schuster" />
		</div>
	),
};

export const Invalid: Story = {
	render: (args) => (
		<div className="grid gap-2">
			<Label htmlFor="sample-input-5432" {...args}>
				Name
			</Label>
			<Input aria-invalid id="sample-input-5432" placeholder="John Schuster" />
		</div>
	),
};
