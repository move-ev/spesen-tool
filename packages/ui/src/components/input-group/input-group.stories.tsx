import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyIcon, EyeOffIcon, FileCodeIcon, SearchIcon } from "lucide-react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from "./input-group";

const meta = {
	title: "Components/InputGroup",
	component: InputGroup,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {},
	args: {},
	render: (args) => (
		<InputGroup className="max-w-xs" {...args}>
			<InputGroupInput placeholder="Search..." />
			<InputGroupAddon>
				<SearchIcon />
			</InputGroupAddon>
			<InputGroupAddon align="inline-end">12 results</InputGroupAddon>
		</InputGroup>
	),
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InlineStart: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput id="inline-start-input" placeholder="Search..." />
			<InputGroupAddon align="inline-start">
				<SearchIcon className="text-muted-foreground" />
			</InputGroupAddon>
		</InputGroup>
	),
};

export const InlineEnd: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput
				id="inline-end-input"
				placeholder="Enter password"
				type="password"
			/>
			<InputGroupAddon align="inline-end">
				<EyeOffIcon />
			</InputGroupAddon>
		</InputGroup>
	),
};

export const BlockStart: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupTextarea
				className="font-mono text-sm"
				id="block-start-textarea"
				placeholder="console.log('Hello, world!');"
			/>
			<InputGroupAddon align="block-start">
				<FileCodeIcon className="text-muted-foreground" />
				<InputGroupText className="font-mono">script.js</InputGroupText>
				<InputGroupButton className="ml-auto" size="icon-xs">
					<CopyIcon />
					<span className="sr-only">Copy</span>
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
};

export const BlockEnd: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupTextarea
				id="block-end-textarea"
				placeholder="Write a comment..."
			/>
			<InputGroupAddon align="block-end">
				<InputGroupText>0/280</InputGroupText>
				<InputGroupButton className="ml-auto" size="sm" variant="default">
					Post
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
};

export const InputInvalid: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput
				aria-invalid
				id="inline-end-input-invalid"
				placeholder="Enter password"
			/>
			<InputGroupAddon align="inline-end">
				<EyeOffIcon />
			</InputGroupAddon>
		</InputGroup>
	),
};

export const TextareaInvalid: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupTextarea
				aria-invalid
				id="block-end-textarea-invalid"
				placeholder="Write a comment..."
			/>
			<InputGroupAddon align="block-end">
				<InputGroupText>0/280</InputGroupText>
				<InputGroupButton className="ml-auto" size="sm" variant="default">
					Post
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
};

export const InputDisabled: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput
				disabled
				id="inline-end-input-disabled"
				placeholder="Enter password"
			/>
			<InputGroupAddon align="inline-end">
				<EyeOffIcon />
			</InputGroupAddon>
		</InputGroup>
	),
};

export const TextareaDisabled: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupTextarea
				disabled
				id="block-end-textarea-disabled"
				placeholder="Write a comment..."
			/>
			<InputGroupAddon align="block-end">
				<InputGroupText>0/280</InputGroupText>
				<InputGroupButton className="ml-auto" size="sm" variant="default">
					Post
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
};
