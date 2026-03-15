import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiderForm } from "./rider-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSaveRider = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("@/lib/dj/rider-actions", () => ({
  saveRider: (...args: unknown[]) => mockSaveRider(...args),
}));

describe("RiderForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockSaveRider.mockReset();
  });

  it("renders empty form when no initial data", () => {
    render(<RiderForm />);
    expect(screen.getByText("CDJs")).toBeInTheDocument();
    expect(screen.getByText("Turntables")).toBeInTheDocument();
    expect(screen.getByText("Mixer")).toBeInTheDocument();
    expect(screen.getByText("Needles provided by venue")).toBeInTheDocument();
    expect(screen.getByText("USB input required")).toBeInTheDocument();
    expect(screen.getByText("Laptop stand")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Booth monitors/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Booth requirements/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Power requirements/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hospitality/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save rider" })
    ).toBeInTheDocument();
  });

  it("renders edit form with initial data", () => {
    render(
      <RiderForm
        initialData={{
          id: "r1",
          dj_profile_id: "dj1",
          version: 3,
          equipment: {
            cdjs: true,
            cdj_model: "CDJ-3000",
            turntables: false,
            mixer: true,
            mixer_model: "Xone:96",
          },
          booth_monitors: "2x KRK Rokit 8",
          booth_requirements: "Enclosed booth",
          power_requirements: "2x grounded outlets",
          hospitality: "Water and towels",
          is_current: true,
          created_at: "",
        }}
      />
    );

    // CDJ checkbox should be checked
    const cdjCheckbox = screen.getByRole("checkbox", { name: "CDJs" });
    expect(cdjCheckbox).toBeChecked();

    // CDJ model should be visible and populated
    expect(screen.getByDisplayValue("CDJ-3000")).toBeInTheDocument();

    // Mixer should be checked
    const mixerCheckbox = screen.getByRole("checkbox", { name: "Mixer" });
    expect(mixerCheckbox).toBeChecked();
    expect(screen.getByDisplayValue("Xone:96")).toBeInTheDocument();

    // Turntables should not be checked
    const turntableCheckbox = screen.getByRole("checkbox", {
      name: "Turntables",
    });
    expect(turntableCheckbox).not.toBeChecked();

    // Text fields should be populated
    expect(screen.getByDisplayValue("2x KRK Rokit 8")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Enclosed booth")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2x grounded outlets")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Water and towels")).toBeInTheDocument();

    // Button text should be "Save changes"
    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument();

    // Version should be displayed
    expect(screen.getByText("Version 3")).toBeInTheDocument();
  });

  it("shows CDJ model input when CDJs checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<RiderForm />);

    // Model input should not be visible initially
    expect(screen.queryByLabelText(/^CDJ model/)).not.toBeInTheDocument();

    // Check CDJs
    await user.click(screen.getByRole("checkbox", { name: "CDJs" }));

    // Model input should now be visible
    expect(screen.getByLabelText(/^CDJ model/)).toBeInTheDocument();
  });

  it("shows turntable model input when Turntables checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<RiderForm />);

    expect(screen.queryByLabelText(/^Turntable model/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Turntables" }));

    expect(screen.getByLabelText(/^Turntable model/)).toBeInTheDocument();
  });

  it("shows mixer model input when Mixer checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<RiderForm />);

    expect(screen.queryByLabelText(/^Mixer model/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Mixer" }));

    expect(screen.getByLabelText(/^Mixer model/)).toBeInTheDocument();
  });

  it("submits rider and redirects", async () => {
    const user = userEvent.setup();
    mockSaveRider.mockResolvedValue({ data: {}, error: null });

    render(<RiderForm />);

    await user.click(screen.getByRole("checkbox", { name: "CDJs" }));
    await user.type(screen.getByLabelText(/^CDJ model/), "CDJ-3000");
    await user.type(screen.getByLabelText(/^Hospitality/), "Water");

    await user.click(screen.getByRole("button", { name: "Save rider" }));

    expect(mockSaveRider).toHaveBeenCalledWith({
      equipment: {
        cdjs: true,
        cdj_model: "CDJ-3000",
        turntables: false,
        turntable_model: undefined,
        mixer: false,
        mixer_model: undefined,
        needles_provided: false,
        usb_required: false,
        laptop_stand: false,
        other: undefined,
      },
      booth_monitors: null,
      booth_requirements: null,
      power_requirements: null,
      hospitality: "Water",
    });
    expect(mockPush).toHaveBeenCalledWith("/profile");
  });

  it("shows error on failure", async () => {
    const user = userEvent.setup();
    mockSaveRider.mockResolvedValue({
      data: null,
      error: "DJ profile not found",
    });

    render(<RiderForm />);

    await user.click(screen.getByRole("button", { name: "Save rider" }));

    expect(screen.getByText("DJ profile not found")).toBeInTheDocument();
  });

  it("does not show version for new riders", () => {
    render(<RiderForm />);
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
  });
});
