const RegistrationModel = require('../models/registrationModel');
const EventModel = require('../models/eventModel');
const PDFDocument = require('pdfkit');

// Users register for events; capacity and duplicate checks happen here.
async function registerForEvent(req, res, next) {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ message: 'eventId is required' });

    const event = await EventModel.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const currentCount = await RegistrationModel.countForEvent(eventId);
    if (currentCount >= event.max_participants) {
      return res.status(400).json({ message: 'This event is full' });
    }

    const registrationId = await RegistrationModel.create({
      userId: req.user.id,
      eventId,
      // Always 'paid': this is a sandbox/test-mode payment gateway (per
      // the brief), so there's no real processor to verify against.
      // A registration is only ever created after the frontend's fake
      // payment step succeeds (or immediately, for free events) — see
      // public/js/event-details.js.
      paymentStatus: 'paid'
    });

    res.status(201).json({ message: 'Registered successfully', registrationId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    next(err);
  }
}

// "View Registered Events" — a user's own list.
async function getMyRegistrations(req, res, next) {
  try {
    res.json(await RegistrationModel.findByUser(req.user.id));
  } catch (err) {
    next(err);
  }
}

// "View Participants" — a manager's own event only.
async function getEventParticipants(req, res, next) {
  try {
    const event = await EventModel.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.manager_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only view participants for your own events' });
    }
    res.json(await RegistrationModel.findByEventForManager(req.params.eventId));
  } catch (err) {
    next(err);
  }
}

// Payment receipt PDF — the user downloads this after paying for a
// booking. findByIdForUser() (models/registrationModel.js) filters by
// req.user.id in the query itself, so a user can never receive
// someone else's receipt by guessing another registration_id in the
// URL, regardless of what the controller does after that.
async function downloadReceipt(req, res, next) {
  try {
    const registration = await RegistrationModel.findByIdForUser(req.params.id, req.user.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const price = Number(registration.ticket_price);
    const priceLabel = price === 0 ? 'Free' : `$${price.toFixed(2)}`;
    const eventDate = new Date(registration.event_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const eventTime = String(registration.event_time).slice(0, 5);
    const paidOn = new Date(registration.registered_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${registration.registration_id}.pdf"`
    );

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('LocalLoop', { align: 'left' });
    doc.fontSize(10).font('Helvetica').fillColor('#666').text('Payment Receipt', { align: 'left' });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown(1);

    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('Receipt Details');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Receipt No.:     REG-${String(registration.registration_id).padStart(6, '0')}`);
    doc.text(`Payment Status:  ${registration.payment_status.toUpperCase()}`);
    doc.text(`Paid On:         ${paidOn}`);
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Billed To');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(registration.user_name);
    doc.text(registration.user_email);
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Event');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(registration.event_title);
    doc.text(`Organizer:  ${registration.organizer}`);
    doc.text(`Date:       ${eventDate} at ${eventTime}`);
    doc.text(`Location:   ${registration.location}`);
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
    doc.moveDown(0.75);

    doc.fontSize(12).font('Helvetica-Bold').text(`Amount Paid: ${priceLabel}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(8).font('Helvetica').fillColor('#999')
      .text('This is a system-generated receipt from LocalLoop. Thank you for your registration.', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { registerForEvent, getMyRegistrations, getEventParticipants, downloadReceipt };
