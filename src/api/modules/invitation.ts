import { request } from '@/api/http'
import type { GenerateInvitationRequest, InvitationVO } from '@/api/types'

/** Admin invitation-code endpoints (AdminInvitationController). */
export const invitationApi = {
  generate(data: GenerateInvitationRequest) {
    return request<InvitationVO[]>({
      url: '/admin/v1/invitations',
      method: 'POST',
      data,
    })
  },
}