import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route'; // Assuming the handler is in the same directory
import { prisma } from '@/lib/prisma';

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    cliente: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/clientes', () => {

  beforeEach(() => {
    // Clear mock history before each test
    vi.clearAllMocks();
  });

  it('should return a list of clients with a 200 status code', async () => {
    // Arrange
    const mockClientes = [
      { id: 1, nombre: 'Cliente Uno', email: 'uno@test.com' },
      { id: 2, nombre: 'Cliente Dos', email: 'dos@test.com' },
    ];
    (prisma.cliente.findMany as vi.Mock).mockResolvedValue(mockClientes);

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockClientes);
    expect(prisma.cliente.findMany).toHaveBeenCalledOnce();
  });

  it('should return a 500 status code if prisma throws an error', async () => {
    // Arrange
    const errorMessage = 'Database connection failed';
    (prisma.cliente.findMany as vi.Mock).mockRejectedValue(new Error(errorMessage));

    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body).toEqual({ message: 'Error interno del servidor' });
    expect(prisma.cliente.findMany).toHaveBeenCalledOnce();
  });
});
