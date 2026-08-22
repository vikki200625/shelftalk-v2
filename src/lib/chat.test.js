import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOrCreateChannel } from './chat'

// getOrCreateChannel is a thin wrapper over the create_dm_channel rpc
// (SECURITY DEFINER, applied live 2026-08-22). Mock the client and
// assert the call shape and error passthrough.
const supabaseMock = vi.hoisted(() => ({
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: supabaseMock }))

describe('getOrCreateChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls the create_dm_channel rpc with the other user id', async () => {
    supabaseMock.rpc.mockResolvedValue({ data: 'channel-uuid', error: null })

    const { channelId, error } = await getOrCreateChannel('me-id', 'them-id')

    expect(supabaseMock.rpc).toHaveBeenCalledWith('create_dm_channel', {
      other_user: 'them-id',
    })
    expect(channelId).toBe('channel-uuid')
    expect(error).toBeNull()
  })

  it('returns the existing channel id when one is already open', async () => {
    // reuse path inside the function — same rpc, same return contract
    supabaseMock.rpc.mockResolvedValue({ data: 'existing-channel', error: null })

    const { channelId, error } = await getOrCreateChannel('me-id', 'them-id')

    expect(channelId).toBe('existing-channel')
    expect(error).toBeNull()
  })

  it('passes through rpc errors (e.g. cannot DM yourself)', async () => {
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: { message: 'cannot DM yourself' },
    })

    const { channelId, error } = await getOrCreateChannel('me-id', 'me-id')

    expect(channelId).toBeNull()
    expect(error.message).toBe('cannot DM yourself')
  })
})
