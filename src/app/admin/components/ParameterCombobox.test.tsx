import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ParameterCombobox from "./ParameterCombobox";

const options = ["Glenfarclas", "Glenfiddich", "Macallan"];

describe("ParameterCombobox", () => {
  it("shows defaultValue in input before interaction", () => {
    render(
      <ParameterCombobox name="distillery" options={options} defaultValue="Macallan" />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("Macallan");
  });

  it("renders toggle button", () => {
    render(<ParameterCombobox name="distillery" options={options} />);
    expect(screen.getByRole("button", { name: "선택지 열기" })).toBeInTheDocument();
  });

  it("opens dropdown with all options on focus", async () => {
    const user = userEvent.setup();
    render(<ParameterCombobox name="distillery" options={options} />);

    await user.click(screen.getByRole("textbox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    options.forEach((opt) => {
      expect(screen.getByRole("option", { name: opt })).toBeInTheDocument();
    });
  });

  it("clears input on focus and shows all options when defaultValue is set", async () => {
    const user = userEvent.setup();
    render(
      <ParameterCombobox name="distillery" options={options} defaultValue="Macallan" />,
    );

    await user.click(screen.getByRole("textbox"));

    expect(screen.getByRole("textbox")).toHaveValue("");
    options.forEach((opt) => {
      expect(screen.getByRole("option", { name: opt })).toBeInTheDocument();
    });
  });

  it("filters options as user types", async () => {
    const user = userEvent.setup();
    render(<ParameterCombobox name="distillery" options={options} />);

    await user.click(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "glen");

    expect(screen.getByRole("option", { name: "Glenfarclas" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Glenfiddich" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Macallan" })).not.toBeInTheDocument();
  });

  it("selects an option, updates input, and closes dropdown", async () => {
    const user = userEvent.setup();
    render(<ParameterCombobox name="distillery" options={options} />);

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("option", { name: "Glenfiddich" }));

    expect(screen.getByRole("textbox")).toHaveValue("Glenfiddich");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("restores committed value when focus leaves without selecting", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ParameterCombobox
          name="distillery"
          options={options}
          defaultValue="Macallan"
        />
        <button>외부 버튼</button>
      </div>,
    );

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("textbox")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "외부 버튼" }));

    expect(screen.getByRole("textbox")).toHaveValue("Macallan");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows no-match message when typed text matches nothing", async () => {
    const user = userEvent.setup();
    render(<ParameterCombobox name="distillery" options={options} />);

    await user.click(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "xyz");

    expect(screen.getByText("일치하는 선택지가 없습니다.")).toBeInTheDocument();
  });

  it("deduplicates identical options", async () => {
    const user = userEvent.setup();
    render(
      <ParameterCombobox
        name="distillery"
        options={["Macallan", "Macallan", "Glenfiddich"]}
      />,
    );

    await user.click(screen.getByRole("textbox"));

    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("closes dropdown on Escape", async () => {
    const user = userEvent.setup();
    render(<ParameterCombobox name="distillery" options={options} />);

    await user.click(screen.getByRole("textbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("allows filtering with backspace after selecting an option", async () => {
    const user = userEvent.setup();
    render(
      <ParameterCombobox name="brand" options={["Glenfarclas", "Glenfiddich", "Macallan"]} />,
    );

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("option", { name: "Glenfarclas" }));

    // "Glenfarclas" (11자) → backspace 7번 → "Glen"
    await user.keyboard(
      "{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}",
    );

    expect(screen.getByRole("textbox")).toHaveValue("Glen");
    expect(screen.getByRole("option", { name: "Glenfarclas" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Glenfiddich" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Macallan" })).not.toBeInTheDocument();
  });

  it("renders plain input without toggle button when options is empty", () => {
    render(<ParameterCombobox name="distillery" options={[]} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "선택지 열기" })).not.toBeInTheDocument();
  });

  it("renders plain input without toggle button when options is undefined", () => {
    render(<ParameterCombobox name="distillery" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "선택지 열기" })).not.toBeInTheDocument();
  });

  it("carries committed value in hidden input for form submission", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ParameterCombobox
        name="brand"
        options={["Glenlivet", "Glenfiddich"]}
        defaultValue="Glenlivet"
      />,
    );

    expect(container.querySelector('input[name="brand"]')).toHaveValue("Glenlivet");

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByRole("option", { name: "Glenfiddich" }));

    expect(container.querySelector('input[name="brand"]')).toHaveValue("Glenfiddich");
  });
});
