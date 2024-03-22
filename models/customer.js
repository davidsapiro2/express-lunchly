"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes;
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

  /* Get customer's full name */
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /* get full name */

  /** find all customers. if searchTerm passed, filter by searchTerm. */

  static async all(searchTerm) {
    const query = searchTerm || ' ';
    const [firstName, lastName] = query.split(' ');
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
           FROM customers
           WHERE first_name ILIKE $1 AND last_name ILIKE $2
           ORDER BY last_name, first_name;`,
           [`%${firstName}%`, `%${lastName}%`],
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** Gets list of users filtered by a given search term */

  static async getFiltered(searchTerm) {
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      WHERE concat(first_name, ' ', last_name) ILIKE $1;`,
      [`%${searchTerm}%`],
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** Gets top ten customers by number of reservations */

  static async getTopTen() {
    const results = await db.query(
      `SELECT customers.id,
              customers.first_name AS "firstName",
              customers.last_name AS "lastName",
              customers.phone,
              customers.notes,
              count(reservations.id) as "numRes"
      FROM customers
      JOIN reservations ON customers.id = reservations.customer_id
      GROUP BY customers.id
      ORDER BY "numRes" desc
      LIMIT 10
      `
    );

    return results.rows.map(c => new Customer(c));
  }

}

module.exports = Customer;
