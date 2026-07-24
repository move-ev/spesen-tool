import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	CircleDollarSignIcon,
	CreditCardIcon,
	IdCardIcon,
	LandmarkIcon,
	LoaderIcon,
} from "lucide-react";
import { Button } from "../button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../select";
import {
	Properties,
	PropertiesLabel,
	PropertiesList,
	Property,
	PropertyLabel,
	PropertyValue,
} from "./properties";

const meta = {
	title: "Components/Properties",
	component: Properties,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {},
	args: {},
	render: ({ ...args }) => (
		<Properties {...args}>
			<PropertiesLabel>Überweisung</PropertiesLabel>
			<PropertiesList>
				<Property>
					<PropertyLabel>
						<CreditCardIcon />
						IBAN
					</PropertyLabel>
					<PropertyValue value="DE75 1001 2345 0293 1509 01" />
				</Property>
				<Property>
					<PropertyLabel>
						<LandmarkIcon />
						BIC
					</PropertyLabel>
					<PropertyValue value="WELADED1MST" />
				</Property>
				<Property>
					<PropertyLabel>
						<IdCardIcon /> Kontoname
					</PropertyLabel>
					<PropertyValue value="John Mark Schuster" />
				</Property>
				<Property>
					<PropertyLabel>
						<CircleDollarSignIcon /> Betrag
					</PropertyLabel>
					<PropertyValue format={(value) => `${value} €`} value={24.31} />
				</Property>
			</PropertiesList>
		</Properties>
	),
} satisfies Meta<React.ComponentProps<typeof Properties>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomField: Story = {
	render: ({ ...args }) => (
		<Properties {...args}>
			<PropertiesLabel>Überweisung</PropertiesLabel>
			<PropertiesList>
				<Property>
					<PropertyLabel>
						<LoaderIcon />
						Status
					</PropertyLabel>
					<PropertyValue
						render={() => {
							return (
								<Select defaultValue={"car"}>
									<SelectTrigger
										render={
											<Button className={"-translate-x-2"} size={"sm"} variant={"ghost"}>
												<SelectValue />
											</Button>
										}
									/>
									<SelectContent>
										<SelectGroup>
											<SelectItem value={"House"}>House</SelectItem>
											<SelectItem value={"Car"}>Car</SelectItem>
											<SelectItem value={"Food"}>Food</SelectItem>
											<SelectItem value={"Money"}>Money</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							);
						}}
						value="DE75 1001 2345 0293 1509 01"
					/>
				</Property>
				<Property>
					<PropertyLabel>
						<LandmarkIcon />
						BIC
					</PropertyLabel>
					<PropertyValue value="WELADED1MST" />
				</Property>
				<Property>
					<PropertyLabel>
						<IdCardIcon /> Kontoname
					</PropertyLabel>
					<PropertyValue value="John Mark Schuster" />
				</Property>
				<Property>
					<PropertyLabel>
						<CircleDollarSignIcon /> Betrag
					</PropertyLabel>
					<PropertyValue format={(value) => `${value} €`} value={24.31} />
				</Property>
			</PropertiesList>
		</Properties>
	),
};
