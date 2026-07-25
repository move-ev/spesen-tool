import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";

const meta = {
	title: "Components/Switch",
	component: Switch,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
		},
		checked: {
			control: "boolean",
		},
	},
	args: {
		disabled: false,
		checked: false,
	},
	render: ({ ...args }) => <Switch {...args} />,
} satisfies Meta<React.ComponentProps<typeof Switch>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
	args: {
		"aria-invalid": true,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};
