import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddSaleForm from '@/components/AddSaleForm';

describe('AddSaleForm Component', () => {
  let onSaleAddedMock: any;

  beforeEach(() => {
    // Reset mocks before each test
    onSaleAddedMock = vi.fn();
    global.fetch = vi.fn();
  });

  it('should submit the form with valid data and call onSaleAdded on success', async () => {
    const user = userEvent.setup();
    (global.fetch as vi.Mock).mockResolvedValue({ ok: true });

    render(<AddSaleForm clienteId={1} onSaleAdded={onSaleAddedMock} />);

    // Act
    await user.type(screen.getByLabelText(/Monto/i), '50000');
    await user.type(screen.getByLabelText(/Fecha/i), '2025-10-03');
    await user.type(screen.getByLabelText(/Descripción/i), 'Venta de prueba');
    await user.click(screen.getByRole('button', { name: /Guardar Venta/i }));

    // Assert
    expect(global.fetch).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith('/api/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monto: 50000,
        fecha: '2025-10-03',
        descripcion: 'Venta de prueba',
        clienteId: 1,
      }),
    });

    // Check if the success callback was called
    expect(onSaleAddedMock).toHaveBeenCalledOnce();

    // Check if the form was cleared
    expect(screen.getByLabelText(/Monto/i)).toHaveValue(null);
    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('');
  });

  it('should display an error message if the submission fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Error del servidor';
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    });

    render(<AddSaleForm clienteId={1} onSaleAdded={onSaleAddedMock} />);

    // Act
    await user.type(screen.getByLabelText(/Monto/i), '50000');
    await user.click(screen.getByRole('button', { name: /Guardar Venta/i }));

    // Assert
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(errorMessage);
    expect(onSaleAddedMock).not.toHaveBeenCalled();
  });
});
