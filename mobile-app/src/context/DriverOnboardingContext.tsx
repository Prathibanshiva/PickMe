import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type VehicleType =
  | "bike"
  | "auto"
  | "car"
  | "sedan"
  | "suv";

interface DriverOnboardingData {
  driverName: string;
  profilePhoto: string;
  aadhaarDocument: string;
  drivingLicenceDocument: string;
  vehicleType: VehicleType | null;
  vehicleNumber: string;
  vehiclePhoto: string;
}

interface DriverOnboardingContextValue {
  data: DriverOnboardingData;

  setDriverName: (value: string) => void;
  setProfilePhoto: (value: string) => void;
  setAadhaarDocument: (value: string) => void;
  setDrivingLicenceDocument: (value: string) => void;
  setVehicleType: (value: VehicleType) => void;
  setVehicleNumber: (value: string) => void;
  setVehiclePhoto: (value: string) => void;

  resetOnboarding: () => void;
  populateFromProfile: (
    profile: {
      profilePhoto?: string | null;
      aadhaarDocument?: string | null;
      drivingLicenceDocument?: string | null;
      vehicleType?: string | null;
      vehicleNumber?: string | null;
      vehiclePhoto?: string | null;
    },
    driverName?: string
  ) => void;
}

const initialData: DriverOnboardingData = {
  driverName: "",
  profilePhoto: "",
  aadhaarDocument: "",
  drivingLicenceDocument: "",
  vehicleType: null,
  vehicleNumber: "",
  vehiclePhoto: "",
};

const DriverOnboardingContext =
  createContext<DriverOnboardingContextValue | null>(
    null
  );

export function DriverOnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] =
    useState<DriverOnboardingData>(initialData);

  const value = useMemo(
    () => ({
      data,

      setDriverName: (value: string) =>
        setData((current) => ({
          ...current,
          driverName: value,
        })),

      setProfilePhoto: (value: string) =>
        setData((current) => ({
          ...current,
          profilePhoto: value,
        })),

      setAadhaarDocument: (value: string) =>
        setData((current) => ({
          ...current,
          aadhaarDocument: value,
        })),

      setDrivingLicenceDocument: (value: string) =>
        setData((current) => ({
          ...current,
          drivingLicenceDocument: value,
        })),

      setVehicleType: (value: VehicleType) =>
        setData((current) => ({
          ...current,
          vehicleType: value,
        })),

      setVehicleNumber: (value: string) =>
        setData((current) => ({
          ...current,
          vehicleNumber: value,
        })),

      setVehiclePhoto: (value: string) =>
        setData((current) => ({
          ...current,
          vehiclePhoto: value,
        })),

      resetOnboarding: () => setData(initialData),
      populateFromProfile: (
        profile: {
          profilePhoto?: string | null;
          aadhaarDocument?: string | null;
          drivingLicenceDocument?: string | null;
          vehicleType?: string | null;
          vehicleNumber?: string | null;
          vehiclePhoto?: string | null;
        },
        driverName?: string
      ) => {
        setData((current) => ({
          driverName: driverName || current.driverName,
          profilePhoto: profile.profilePhoto || current.profilePhoto,
          aadhaarDocument: profile.aadhaarDocument || current.aadhaarDocument,
          drivingLicenceDocument:
            profile.drivingLicenceDocument || current.drivingLicenceDocument,
          vehicleType:
            (profile.vehicleType as VehicleType) || current.vehicleType,
          vehicleNumber: profile.vehicleNumber || current.vehicleNumber,
          vehiclePhoto: profile.vehiclePhoto || current.vehiclePhoto,
        }));
      },
    }),
    [data]
  );

  return (
    <DriverOnboardingContext.Provider value={value}>
      {children}
    </DriverOnboardingContext.Provider>
  );
}

export function useDriverOnboarding() {
  const context = useContext(
    DriverOnboardingContext
  );

  if (!context) {
    throw new Error(
      "useDriverOnboarding must be used inside DriverOnboardingProvider"
    );
  }

  return context;
}