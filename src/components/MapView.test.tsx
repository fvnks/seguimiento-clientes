import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapView from '@/components/MapView';

// Mock react-leaflet components as they don't render in a JSDOM environment
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer"></div>,
  Marker: () => <div data-testid="marker"></div>,
}));

describe('MapView Component', () => {

  it('should render the map when a valid position is provided', () => {
    // Arrange
    const mockPosition: [number, number] = [-33.45, -70.64];

    // Act
    render(<MapView position={mockPosition} />);

    // Assert
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });

  it('should render a fallback message when position is null or invalid', () => {
    // Arrange
    const invalidPosition: any = null;

    // Act
    render(<MapView position={invalidPosition} />);

    // Assert
    expect(screen.getByText('Ubicación no disponible.')).toBeInTheDocument();
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('should render a fallback message for an incomplete position array', () => {
    // Arrange
    const incompletePosition: any = [-33.45];

    // Act
    render(<MapView position={incompletePosition} />);

    // Assert
    expect(screen.getByText('Ubicación no disponible.')).toBeInTheDocument();
  });
});
