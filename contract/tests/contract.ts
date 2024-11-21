import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { EscrowProgram } from "../target/types/escrow_program"; // Update this to match your program path

describe("contract", () => {
  it("createPayment", async () => {
    // Set the provider
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider();
    const program = anchor.workspace.Contract as Program<EscrowProgram>;

    // Define the necessary inputs
    const metadata = "example-metadata";  // Your metadata string
    const clientPublicKey = new PublicKey("7fUEXZSebZyezpu4bdsYoXhdqiTe9LgoQ8MDY2mHD9bN"); // Client's public key
    const merchantPublicKey = new PublicKey("7fUEXZSebZyezpu4bdsYoXhdqiTe9LgoQ8MDY2mHD9bN"); // Merchant's public key
    const amount = 1000; // The payment amount

    // Derive the PDA (Program Derived Address) for the payment account using the metadata
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(metadata)],
      program.programId
    );

    // Create the transaction to invoke the `create_payment` function
    const tx = await program.methods.createPayment(
      new anchor.BN(amount),  // Convert amount to anchor's BN type
      merchantPublicKey,
      clientPublicKey,
      metadata
    )
      .accounts({
        paymentAccount: pda,  // This is the derived PDA for the payment account
        signer: merchantPublicKey, // The wallet of the sender (signer)
        //systemProgram: SystemProgram.programId,
      })
      .rpc();  // Send the transaction

    console.log("Transaction signature:", tx);
  })
});


