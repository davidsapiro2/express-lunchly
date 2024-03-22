"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const { BadRequestError } = require('../expressError');

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /* Get _notes */
  get notes() {
    return this._notes;
  }

  /* Set _notes. If text is falsey, set to empty string. */
  set notes(text) {
    if (!text) {
      this._notes = '';
    } else {
      this._notes = text;
    }
  }

  /** Get _numGuests */
  get numGuests() {
    return this._numGuests;
  }

  /** Set _numGuests. If 0, throws an error */
  set numGuests(guests) {
    if (guests < 1) {
      throw new BadRequestError("Must have at least one guest.");
    } else {
      this._numGuests = guests;
    };
  }

  /** Get startAt */
  get startAt() {
    return this._startAt;
  }

  /** Set startAt */
  set startAt(date) {
    this._startAt = new Date(date);
  }


  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** Save reservation. If doesn't exist, create new reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
        SET numGuests=$1,
            startAt=$2,
            notes=$3
        WHERE id = $4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }

}

module.exports = Reservation;
