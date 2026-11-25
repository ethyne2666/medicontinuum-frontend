import { randomUUID } from 'node:crypto';
import { HttpError } from '../lib/errors.js';
import { peerView } from './entities.js';

const URGENCY_RANK = { CRITICAL: 0, URGENT: 1, ROUTINE: 2 };

const byId = (store, id) => (id ? store.data.entities.find((e) => e.id === id) : null);
const brief = (e) => (e ? peerView(e) : null);

export const canSee = (s, me) =>
  s.ownerId === me.id || s.responderId === me.id || s.targetId === me.id || (!s.targetId && s.status === 'OPEN');

export function shareView(store, s, me) {
  const isOwner = s.ownerId === me.id;
  const isResponder = s.responderId === me.id;
  const involved = isOwner || isResponder;
  const settled = s.status === 'ACCEPTED' || s.status === 'FULFILLED';

  let counterpart = null;
  if (involved && settled) {
    const other = byId(store, isOwner ? s.responderId : s.ownerId);
    if (other) {
      counterpart = { ...peerView(other), contactPerson: other.contactPerson, email: other.email, phone: other.phone };
    }
  }

  return {
    id: s.id,
    direction: s.direction,
    resourceType: s.resourceType,
    urgency: s.urgency,
    quantity: s.quantity,
    details: s.details,
    notes: s.notes,
    neededBy: s.neededBy,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    owner: brief(byId(store, s.ownerId)),
    target: brief(byId(store, s.targetId)),
    responder: involved ? brief(byId(store, s.responderId)) : null,
    responseMessage: involved ? s.responseMessage : '',
    isMine: isOwner,
    counterpart,
    canRespond: !isOwner && s.status === 'OPEN' && (!s.targetId || s.targetId === me.id) && !s.declinedBy.includes(me.id),
    canFulfil: isOwner && s.status === 'ACCEPTED',
    canCancel: isOwner && (s.status === 'OPEN' || s.status === 'ACCEPTED'),
  };
}

export function createShare(store, me, input) {
  if (input.resourceType === 'ORGAN' && !(me.kind === 'ORGANIZATION' && me.orgType === 'HOSPITAL')) {
    throw new HttpError(403, 'FORBIDDEN', 'Only registered hospitals can post organ requests or offers.');
  }
  let target = null;
  if (input.targetPublicId) {
    target = store.data.entities.find((e) => e.publicId === input.targetPublicId && e.status === 'ACTIVE');
    if (!target) throw new HttpError(404, 'NOT_FOUND', 'The selected organization was not found.', { targetPublicId: 'Not found' });
    if (target.id === me.id) throw new HttpError(400, 'INVALID', 'You cannot send a share to yourself.', { targetPublicId: 'Choose another organization' });
  }
  const now = new Date().toISOString();
  const share = {
    id: randomUUID(),
    direction: input.direction,
    resourceType: input.resourceType,
    urgency: input.urgency,
    quantity: input.quantity,
    details: input.details,
    notes: input.notes,
    neededBy: input.neededBy ?? null,
    ownerId: me.id,
    targetId: target?.id ?? null,
    status: 'OPEN',
    responderId: null,
    responseMessage: '',
    declinedBy: [],
    createdAt: now,
    updatedAt: now,
  };
  store.data.shares.push(share);
  store.save();
  return share;
}

export function listShares(store, me, { scope = 'incoming', type, direction, status }) {
  let rows = store.data.shares.filter((s) => {
    if (scope === 'mine') return s.ownerId === me.id;
    if (scope === 'responded') return s.responderId === me.id;
    // incoming: open items from others that are broadcast or aimed at me and that I haven't declined
    return s.ownerId !== me.id && s.status === 'OPEN' && (!s.targetId || s.targetId === me.id) && !s.declinedBy.includes(me.id);
  });
  if (type) rows = rows.filter((s) => s.resourceType === type);
  if (direction) rows = rows.filter((s) => s.direction === direction);
  if (status) rows = rows.filter((s) => s.status === status);
  rows.sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || b.createdAt.localeCompare(a.createdAt));
  return rows.map((s) => shareView(store, s, me));
}

function getVisible(store, id, me) {
  const s = store.data.shares.find((x) => x.id === id);
  if (!s || !canSee(s, me)) throw new HttpError(404, 'NOT_FOUND', 'Share not found.');
  return s;
}

export const getShare = (store, id, me) => shareView(store, getVisible(store, id, me), me);

export function respondToShare(store, id, me, { action, message }) {
  const s = getVisible(store, id, me);
  if (s.ownerId === me.id) throw new HttpError(403, 'FORBIDDEN', 'You cannot respond to your own post.');
  if (s.status !== 'OPEN') throw new HttpError(409, 'CLOSED', 'This post is no longer open.');
  if (s.targetId && s.targetId !== me.id) throw new HttpError(404, 'NOT_FOUND', 'Share not found.');
  if (s.declinedBy.includes(me.id)) throw new HttpError(409, 'CLOSED', 'You already declined this post.');

  if (action === 'ACCEPT') {
    s.status = 'ACCEPTED';
    s.responderId = me.id;
    s.responseMessage = message;
  } else if (s.targetId === me.id) {
    s.status = 'DECLINED';
    s.responderId = me.id;
    s.responseMessage = message;
  } else {
    s.declinedBy.push(me.id); // broadcast: just hide it from me
  }
  s.updatedAt = new Date().toISOString();
  store.save();
  return shareView(store, s, me);
}

function ownerTransition(store, id, me, allowedFrom, to) {
  const s = getVisible(store, id, me);
  if (s.ownerId !== me.id) throw new HttpError(403, 'FORBIDDEN', 'Only the owner can do this.');
  if (!allowedFrom.includes(s.status)) throw new HttpError(409, 'INVALID_STATE', `Cannot change a ${s.status.toLowerCase()} post this way.`);
  s.status = to;
  s.updatedAt = new Date().toISOString();
  store.save();
  return shareView(store, s, me);
}

export const fulfilShare = (store, id, me) => ownerTransition(store, id, me, ['ACCEPTED'], 'FULFILLED');
export const cancelShare = (store, id, me) => ownerTransition(store, id, me, ['OPEN', 'ACCEPTED'], 'CANCELLED');

export function shareSummary(store, me) {
  const mine = store.data.shares.filter((s) => s.ownerId === me.id);
  return {
    incomingOpen: listShares(store, me, { scope: 'incoming' }).length,
    myOpen: mine.filter((s) => s.status === 'OPEN').length,
    myAccepted: mine.filter((s) => s.status === 'ACCEPTED').length,
    myFulfilled: mine.filter((s) => s.status === 'FULFILLED').length,
    respondedActive: store.data.shares.filter((s) => s.responderId === me.id && s.status === 'ACCEPTED').length,
  };
}
