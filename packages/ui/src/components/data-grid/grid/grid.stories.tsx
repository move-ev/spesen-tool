import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Building2Icon,
	CalendarIcon,
	CalendarPlusIcon,
	IdCardIcon,
	UserIcon,
} from "lucide-react";
import { useMemo } from "react";
import {
	Grid,
	GridBody,
	GridCell,
	GridHead,
	GridHeader,
	GridRow,
} from "./grid";

const meta = {
	title: "Components/DataGrid/Grid",
	component: Grid,
	parameters: {},
	tags: ["autodocs"],
	argTypes: {
		layout: {
			control: "select",
			options: ["compact", "default", "loose"],
		},
	},
	args: {
		layout: "default",
	},
	render: (args) => {
		const data = useMemo(() => {
			return faker.helpers.multiple(
				() => ({
					id: faker.string.uuid(),
					business: faker.company.name(),
					category: faker.company.buzzNoun(),
					contact: faker.internet.email(),
					createdAt: faker.date.past(),
					dueDate: faker.date.future(),
					count: faker.number.int({ min: 1, max: 1000 }),
				}),
				{ count: 10 },
			);
		}, []);

		return (
			<Grid {...args}>
				<GridHeader>
					<GridRow>
						<GridHead>
							<div data-content>
								<Building2Icon />
								Business
							</div>
						</GridHead>
						<GridHead>
							<div data-content>
								<Building2Icon />
								Category
							</div>
						</GridHead>
						<GridHead>
							<div data-content>
								<IdCardIcon />
								Contact
							</div>
						</GridHead>
						<GridHead>
							<div data-content>
								<UserIcon />
								Business size
							</div>
						</GridHead>
						<GridHead>
							<div data-content>
								<CalendarPlusIcon />
								Created at
							</div>
						</GridHead>
						<GridHead>
							<div data-content>
								<CalendarIcon />
								Due Date
							</div>
						</GridHead>
					</GridRow>
				</GridHeader>
				<GridBody>
					{data.map((row) => (
						<GridRow key={row.id}>
							<GridCell>{row.business}</GridCell>
							<GridCell>{row.category}</GridCell>
							<GridCell>{row.contact}</GridCell>
							<GridCell>{row.count}</GridCell>
							<GridCell>{row.createdAt.toLocaleDateString()}</GridCell>
							<GridCell>{row.dueDate.toLocaleDateString()}</GridCell>
						</GridRow>
					))}
				</GridBody>
			</Grid>
		);
	},
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
