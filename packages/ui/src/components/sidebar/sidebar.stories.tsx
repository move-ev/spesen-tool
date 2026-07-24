import type { Meta, StoryObj } from "@storybook/react-vite";

import DemoPage1 from "./sidebar.demo";

const meta = {
	title: "Components/Sidebar",
	component: Sidebar,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	render: () => <DemoPage1 />,
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
