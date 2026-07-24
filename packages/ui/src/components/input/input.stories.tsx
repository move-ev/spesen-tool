import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
	title: "Components/Input",
	component: Input,
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
	render: (props) => <Input placeholder="Search for something..." {...props} />,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const Invalid: Story = {
	render: () => <Input aria-invalid placeholder="Search for something..." />,
};

export const Disabled: Story = {
	args: { disabled: true },
};
