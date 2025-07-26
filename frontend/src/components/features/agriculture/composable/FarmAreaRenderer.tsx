"use client";

import React from "react";

import { Row, AreaType } from "@/types/farm";

import { germinationAreaPresets } from "./configurations/germinationAreaConfig";
import { growingAreaPresets } from "./configurations/growingAreaConfig";
import { growingAreaConfig } from "./configurations/growingAreaConfig";
import { AreaConfiguration } from "./configurations/types";
import { ContentLayer, RowContent, RackContent } from "./layers/ContentLayer";
import {
  InteractionLayer,
  RowInteraction,
  RackInteraction,
} from "./layers/InteractionLayer";
import { LayoutLayer, RackLayout } from "./layers/LayoutLayer";
import {
  ElementDetailModal,
  GrowWizardModal,
  LayerOverlayModal,
} from "./modals";
import { FarmAreaProvider, useFarmArea } from "./providers/FarmAreaProvider";

interface FarmAreaRendererProps {
  rows: Row[];
  areaType: AreaType;
  configuration: AreaConfiguration;
  className?: string;
  onRowSelect?: (row: Row | null) => void;
  onRackSelect?: (rack: any | null) => void;
  onShelfSelect?: (shelf: any | null) => void;
  onDoubleClick?: (element: any, type: "row" | "rack" | "shelf") => void;
}

export function FarmAreaRenderer({
  rows,
  areaType,
  configuration,
  className,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  onDoubleClick,
}: FarmAreaRendererProps) {
  return (
    <FarmAreaProvider configuration={configuration}>
      <FarmAreaContent
        rows={rows}
        areaType={areaType}
        className={className}
        onRowSelect={onRowSelect}
        onRackSelect={onRackSelect}
        onShelfSelect={onShelfSelect}
        onDoubleClick={onDoubleClick}
      />
    </FarmAreaProvider>
  );
}

// ===== Internal Content Component =====

interface FarmAreaContentProps {
  rows: Row[];
  areaType: AreaType;
  className?: string;
  onRowSelect?: (row: Row | null) => void;
  onRackSelect?: (rack: any | null) => void;
  onShelfSelect?: (shelf: any | null) => void;
  onDoubleClick?: (element: any, type: "row" | "rack" | "shelf") => void;
}

function FarmAreaContent({
  rows,
  areaType,
  className,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  onDoubleClick,
}: FarmAreaContentProps) {
  const { state, actions, configuration } = useFarmArea();

  return (
    <>
      <InteractionLayer className={className}>
        <ContentLayer>
          <LayoutLayer rows={rows}>
            {(row, rowIndex) => (
              <RowRenderer
                key={row.id}
                row={row}
                areaType={areaType}
                onRowSelect={onRowSelect}
                onRackSelect={onRackSelect}
                onShelfSelect={onShelfSelect}
                onDoubleClick={onDoubleClick}
              />
            )}
          </LayoutLayer>
        </ContentLayer>
      </InteractionLayer>

      {/* Modal Rendering */}
      <ModalRenderer />
    </>
  );
}

// ===== Row Renderer =====

interface RowRendererProps {
  row: Row;
  areaType: AreaType;
  onRowSelect?: (row: Row | null) => void;
  onRackSelect?: (rack: any | null) => void;
  onShelfSelect?: (shelf: any | null) => void;
  onDoubleClick?: (element: any, type: "row" | "rack" | "shelf") => void;
}

function RowRenderer({
  row,
  areaType,
  onRowSelect,
  onRackSelect,
  onShelfSelect,
  onDoubleClick,
}: RowRendererProps) {
  return (
    <RowInteraction row={row}>
      <div className="space-y-4">
        {/* Row Header with Content */}
        <RowContent row={row} areaType={areaType} />

        {/* Racks Grid */}
        <RackLayout row={row}>
          {(rack, rackIndex) => (
            <RackRenderer
              key={rack.id}
              rack={rack}
              areaType={areaType}
              onRackSelect={onRackSelect}
              onShelfSelect={onShelfSelect}
              onDoubleClick={onDoubleClick}
            />
          )}
        </RackLayout>
      </div>
    </RowInteraction>
  );
}

// ===== Rack Renderer =====

interface RackRendererProps {
  rack: any;
  areaType: AreaType;
  onRackSelect?: (rack: any | null) => void;
  onShelfSelect?: (shelf: any | null) => void;
  onDoubleClick?: (element: any, type: "row" | "rack" | "shelf") => void;
}

function RackRenderer({
  rack,
  areaType,
  onRackSelect,
  onShelfSelect,
  onDoubleClick,
}: RackRendererProps) {
  return (
    <RackInteraction rack={rack}>
      <RackContent rack={rack} areaType={areaType} />
    </RackInteraction>
  );
}

// ===== Modal Renderer =====

function ModalRenderer() {
  const { state, actions, configuration } = useFarmArea();

  const activeModalConfig = configuration.modals.find(
    (modal) => modal.id === state.activeModal && modal.enabled,
  );

  if (!activeModalConfig || !state.activeModal) {
    return null;
  }

  const handleClose = () => {
    actions.hideModal();
  };

  const modalProps = {
    isOpen: true,
    onClose: handleClose,
  };

  // Map component names to actual components
  switch (activeModalConfig.component) {
    case "ElementDetailModal":
      const elementType =
        state.selectedElement?.type === "device"
          ? "shelf"
          : state.selectedElement?.type || "rack";
      return (
        <ElementDetailModal
          {...modalProps}
          element={state.selectedElement?.data || null}
          elementType={elementType as "row" | "rack" | "shelf"}
          onUpdate={() => {
            // Handle update
          }}
          onDelete={() => {
            // Handle delete
          }}
        />
      );

    case "GrowWizardModal":
      if (!state.selectedShelf) return null;
      return (
        <GrowWizardModal
          {...modalProps}
          shelfId={state.selectedShelf.id}
          shelfName={
            state.selectedShelf.name || `Shelf ${state.selectedShelf.id}`
          }
          onSubmit={(growData) => {
            // Handle grow setup
            console.log("Grow setup:", growData);
            handleClose();
          }}
        />
      );

    case "LayerOverlayModal":
      return (
        <LayerOverlayModal
          {...modalProps}
          overlays={configuration.overlays}
          activeOverlayIds={state.visibleOverlays}
          onUpdateOverlays={(overlays) => {
            // Handle overlay updates
            console.log("Updated overlays:", overlays);
          }}
        />
      );

    default:
      console.warn(`Unknown modal component: ${activeModalConfig.component}`);
      return null;
  }
}

// ===== Convenience Exports =====

export { FarmAreaProvider } from "./providers/FarmAreaProvider";
export {
  growingAreaConfig,
  growingAreaPresets,
} from "./configurations/growingAreaConfig";
export {
  germinationAreaConfig,
  germinationAreaPresets,
} from "./configurations/germinationAreaConfig";
export type { AreaConfiguration } from "./configurations/types";

// ===== Configuration Helpers =====

export function createFarmAreaConfig(
  areaType: AreaType,
  preset?: string,
): AreaConfiguration {
  switch (areaType) {
    case "grow_area":
      return preset && growingAreaPresets[preset]
        ? growingAreaPresets[preset]
        : growingAreaPresets.standard;

    case "germination_tent":
      return preset && germinationAreaPresets[preset]
        ? germinationAreaPresets[preset]
        : germinationAreaPresets.standard;

    default:
      return growingAreaConfig;
  }
}

export function getAvailablePresets(areaType: AreaType): string[] {
  switch (areaType) {
    case "grow_area":
      return ["standard", "simple", "commercial", "research"];

    case "germination_tent":
      return ["standard", "compact", "research", "production", "hobby"];

    default:
      return ["standard"];
  }
}

// ===== Usage Example Component =====

interface ExampleUsageProps {
  rows: Row[];
  areaType: AreaType;
  preset?: string;
}

export function ExampleFarmAreaUsage({
  rows,
  areaType,
  preset = "standard",
}: ExampleUsageProps) {
  const configuration = createFarmAreaConfig(areaType, preset);

  return (
    <div className="p-6">
      <FarmAreaRenderer
        rows={rows}
        areaType={areaType}
        configuration={configuration}
        onRowSelect={(row) => console.log("Row selected:", row)}
        onRackSelect={(rack) => console.log("Rack selected:", rack)}
        onShelfSelect={(shelf) => console.log("Shelf selected:", shelf)}
        onDoubleClick={(element, type) =>
          console.log("Double clicked:", type, element)
        }
      />
    </div>
  );
}
