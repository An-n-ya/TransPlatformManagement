import { request } from '@/api/http'
import type { GenerateInvitationRequest, InvitationVO, SendInvitationEmailRequest } from '@/api/types'

/** Admin invitation-code endpoints (AdminInvitationController). */
export const invitationApi = {
  generate(data: GenerateInvitationRequest) {
    return request<InvitationVO[]>({
      url: '/admin/v1/invitations',
      method: 'POST',
      data,
    })
  },
  sendEmail(data: SendInvitationEmailRequest) {
    return request<InvitationVO>({
      url: '/admin/v1/invitations/send-email',
      method: 'POST',
      data,
    })
  },
}