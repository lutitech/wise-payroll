import { Injectable } from '@nestjs/common';
import * as Transferwise from 'transferwise';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AppService {
  private readonly tw: Transferwise;

  constructor() {
    // initialize the Transferwise client using sandbox API key
    this.tw = new Transferwise({
      sandboxApiTokenKey: '4e24071f-d99d-48fa-95b5-545a9bc59b56',
      environment: 'sandbox',
    });
  }
  
  // define a cron job that accepts parameters for recipientName, accountNumber, amount, and reference
  // the job will run at 0 seconds every hour
  @Cron('0 0 * * * *')
  async createTransfer(
    recipientName: string,
    accountNumber: string,
    amount: number,
    reference: string,
  ) {
    try {
      // retrieve all Transferwise profiles
      const profiles = await this.tw.getProfilesV2();
      if (!profiles.length) {
        throw new Error('No profiles found.');
      }
      
      // find the recipient's profile by full name
      const profile = profiles.find(p => p.fullName === recipientName);
      if (!profile) {
        throw new Error(`No profile found for recipient ${recipientName}.`);
      }
      
      // retrieve all recipient accounts for the given profile and currency
      const recipientAccounts = await this.tw.getRecipientAccountsV1({
        profileId: profile.id,
        currency: 'EUR',
      });

      if (!recipientAccounts) {
        throw new Error(`No recipient accounts found for recipient ${recipientName}.`);
      }
      
      // find the target account by account number
      const targetAccount = recipientAccounts.find(
        (a) => a.accountNumber === accountNumber,
      );
      if (!targetAccount) {
        return {
          statusCode: 400,
          message: `No recipient accounts found for recipient ${accountNumber}.`
        }
      }
  
      // create a quote for the given transfer
      const quote = await this.tw.createQuoteV2({
        profileId: profile.id,
        sourceCurrency: 'EUR',
        targetCurrency: 'EUR',
        targetAmount: amount,
        payOut: 'BALANCE',
      });
      console.log(quote)
      if (!quote) {
        throw new Error(`Failed to retrieve quote for recipient ${recipientName}.`);
      }
  
      // create a transfer using the target account, quote, and reference
      const transfer = await this.tw.createTransferV1({
        targetAccountId: targetAccount.id,
        quoteUuid: quote.id,
        details: {
          reference,
        },
      });
  
      return transfer;
    } catch (error) {
      console.error(error);
      return error.message;
    }
  }  
}
