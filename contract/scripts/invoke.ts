import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { EscrowProgram } from "../target/types/escrow_program"; // Update this to match your program path
import { Keypair } from "@solana/web3.js";


(async () => {
  try {
    console.log("I work")
    // Set the provider
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider();
    const program = anchor.workspace.Contract as Program<EscrowProgram>;

    // Define the necessary inputs
    const metadata = "example-metadata";  // Your metadata string
    const clientPublicKey = new PublicKey("7fUEXZSebZyezpu4bdsYoXhdqiTe9LgoQ8MDY2mHD9bN"); // Client's public key
    const merchantPublicKey = new PublicKey("7fUEXZSebZyezpu4bdsYoXhdqiTe9LgoQ8MDY2mHD9bN"); // Merchant's public key
    const amount = 1000; // The payment amount

    const privateKey = Uint8Array.from([17, 153, 78, 188, 14, 158, 223, 24, 109, 223, 253, 211, 68, 61, 41, 149, 61, 63, 70, 210, 199, 46, 139, 101, 233, 163, 214, 17, 198, 126, 178, 244, 151, 164,
      110, 104, 124, 89, 117, 175, 55, 114, 112, 252, 145, 103, 0, 123, 53, 27, 254, 101, 28, 85, 213, 110, 169, 67, 183, 176, 87, 141, 221, 18]);
    const merchantKeypair = Keypair.fromSecretKey(privateKey);

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
      .signers([merchantKeypair])  // Provide the keypair of the signer
      .rpc();  // Send the transaction

    console.log("Transaction signature:", tx);
  } catch (error) {
    console.error("Error occurred:", error);
  }
})();





