import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox";

const meta = {
	title: "Components/Checkbox",
	component: Checkbox,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
		},
	},
	args: {
		disabled: false,
	},
	render: ({ ...args }) => <Checkbox {...args} />,
} satisfies Meta<React.ComponentProps<typeof Checkbox>>;

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

export const Indeterminate: Story = {
	args: {
		indeterminate: true,
	},
};
